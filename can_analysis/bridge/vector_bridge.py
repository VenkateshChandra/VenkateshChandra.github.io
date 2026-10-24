#!/usr/bin/env python3
"""
===================================================================
TRENDS FOR SALE (TFS) - VECTOR HARDWARE XL DRIVER BRIDGE
Connects Vector Informatik Hardware (VN1610, VN1630, VN1640, CANcaseXL)
to the TFS In-Browser CAN Protocol Analyzer via Local WebSocket.
===================================================================
Prerequisites:
  pip install python-can websockets
"""

import sys
import os
import json
import time
import asyncio
import threading

try:
    import websockets
except ImportError:
    print("[ERROR] 'websockets' package is missing. Run: pip install websockets")
    sys.exit(1)

# Check for python-can
HAS_PYTHON_CAN = False
try:
    import can
    from can.interfaces.vector import VectorBus
    HAS_PYTHON_CAN = True
except Exception as e:
    print(f"[INFO] python-can Vector interface not active ({e}). Starting in fallback/simulation mode.")

PORT = 9002
HOST = "localhost"

connected_clients = set()
vector_bus = None
active_bitrate = 500000
active_channel = 1
is_running = True


def init_vector_hardware(channel=1, bitrate=500000, app_name="TFS_CAN"):
    """Initialize Vector XL Driver hardware port."""
    global vector_bus, active_bitrate, active_channel

    if not HAS_PYTHON_CAN:
        print("[WARN] python-can is not installed. Running simulated virtual bus.")
        return False

    try:
        # Zero-indexed channel for Vector driver
        v_channel = max(0, channel - 1)
        print(f"[VECTOR] Initializing Vector Channel {channel} @ {bitrate} bps (App: '{app_name}')...")

        if vector_bus:
            try:
                vector_bus.shutdown()
            except Exception:
                pass

        vector_bus = VectorBus(
            channel=v_channel,
            bitrate=bitrate,
            app_name=app_name,
            receive_own_messages=False
        )
        active_bitrate = bitrate
        active_channel = channel
        print(f"[VECTOR] Successfully connected to Vector hardware on Channel {channel}!")
        return True
    except Exception as err:
        print(f"[VECTOR ERROR] Failed to connect to Vector hardware: {err}")
        print("[VECTOR] Hint: Verify Vector Hardware Config / Drivers are installed (vxlapi64.dll).")
        vector_bus = None
        return False


def vector_rx_worker(loop):
    """Background reader thread for Vector bus frames."""
    global vector_bus, is_running

    last_sim_tick = time.time()
    sim_id = 0x100

    while is_running:
        if vector_bus:
            try:
                msg = vector_bus.recv(timeout=0.01)
                if msg:
                    frame_data = {
                        "id": msg.arbitration_id,
                        "dlc": msg.dlc,
                        "data": list(msg.data),
                        "channel": active_channel,
                        "is_extended": msg.is_extended_id,
                        "timestamp": msg.timestamp or time.time(),
                        "dir": "RX"
                    }
                    broadcast_frame(loop, frame_data)
            except Exception as e:
                time.sleep(0.05)
        else:
            # Fallback simulator if no physical Vector box is plugged in
            if connected_clients and (time.time() - last_sim_tick > 0.05):
                last_sim_tick = time.time()
                sim_frame = {
                    "id": sim_id,
                    "dlc": 8,
                    "data": [int(time.time() * 100) & 0xFF, 0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE],
                    "channel": 1,
                    "is_extended": False,
                    "timestamp": time.time(),
                    "dir": "RX"
                }
                sim_id = 0x200 if sim_id == 0x100 else 0x100
                broadcast_frame(loop, sim_frame)

            time.sleep(0.01)


def broadcast_frame(loop, frame_dict):
    """Send frame to all connected browser clients."""
    if not connected_clients:
        return
    msg_str = json.dumps(frame_dict)
    for ws in list(connected_clients):
        if ws.open:
            asyncio.run_coroutine_threadsafe(ws.send(msg_str), loop)


async def handle_client(websocket, path):
    """Handle incoming WebSocket connection from TFS Browser Analyzer."""
    global vector_bus
    print(f"[WS] Browser connected from {websocket.remote_address}")
    connected_clients.add(websocket)

    try:
        async for message in websocket:
            try:
                cmd_data = json.loads(message)
                command = cmd_data.get("command")

                if command == "configure":
                    bitrate = cmd_data.get("bitrate", 500000)
                    ch = cmd_data.get("channel", 1)
                    app_name = cmd_data.get("app_name", "TFS_CAN")
                    init_vector_hardware(channel=ch, bitrate=bitrate, app_name=app_name)

                elif command == "transmit":
                    can_id = cmd_data.get("id", 0x100)
                    data_bytes = cmd_data.get("data", [])
                    is_ext = cmd_data.get("is_extended", False)

                    if vector_bus and HAS_PYTHON_CAN:
                        msg = can.Message(
                            arbitration_id=can_id,
                            data=bytearray(data_bytes),
                            is_extended_id=is_ext
                        )
                        vector_bus.send(msg)
                        print(f"[TX] Transmitted ID 0x{can_id:X}: {data_bytes}")
                    else:
                        print(f"[SIM TX] Injected virtual frame ID 0x{can_id:X}")

            except Exception as err:
                print(f"[ERROR] Error processing browser command: {err}")

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)
        print(f"[WS] Browser disconnected.")


async def main():
    print("=" * 60)
    print("   TRENDS FOR SALE (TFS) - VECTOR CAN BUS BRIDGE v1.0")
    print("=" * 60)
    print(f"[*] Starting Vector WebSocket Server on ws://{HOST}:{PORT}")
    print("[*] Open trendsforsale.com/can_analysis/ in your browser.")
    print("=" * 60)

    # Initialize default Vector port
    init_vector_hardware(channel=1, bitrate=500000)

    loop = asyncio.get_running_loop()

    # Start RX background thread
    rx_thread = threading.Thread(target=vector_rx_worker, args=(loop,), daemon=True)
    rx_thread.start()

    async with websockets.serve(handle_client, HOST, PORT):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[STOP] Shutting down Vector Bridge.")
        is_running = False
        if vector_bus:
            vector_bus.shutdown()
