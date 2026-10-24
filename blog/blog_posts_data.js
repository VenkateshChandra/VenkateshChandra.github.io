/* ===================================================================
   TRENDS FOR SALE (TFS) - TECHNICAL BLOG ARTICLES DATA STORE
   Deep-dive tutorials, hardware specs, and step-by-step guides
   =================================================================== */

window.TFS_BLOG_ARTICLES = [
  {
    id: 'can-bus-analysis',
    title: 'Automotive CAN Bus Analysis: Vector vxlapi & SLCAN in the Browser',
    slug: 'automotive-can-bus-vector-vxlapi-slcan-browser',
    category: 'automotive',
    categoryLabel: 'Automotive & Protocols',
    author: 'Venkatesh Chandra',
    authorRole: 'Senior Embedded Software Engineer',
    reviewedBy: 'Mani Kumari Amburu',
    date: 'October 24, 2026',
    readTime: '8 min read',
    featured: true,
    tags: ['CAN Bus', 'Vector vxlapi', 'SLCAN', 'DBC Parser', 'Automotive Diagnostics'],
    summary: 'A complete architectural walkthrough on monitoring, decoding, and transmitting Controller Area Network (CAN 2.0A/B) frames straight from your web browser using Vector hardware and low-cost SLCAN USB adapters.',
    toolLink: '../can_analysis/can_analyzer.html',
    toolName: 'Launch CAN Bus Analyzer',
    content: `
      <h2>1. The Evolution of Automotive Bus Diagnostics</h2>
      <p>
        Traditionally, sniffing CAN bus traffic on automotive test benches or vehicle OBD-II ports required installing heavy, expensive native desktop suites. If you were working on a field test with a technician's laptop, driver mismatches, license dongles, and OS incompatibilities could stall validation for hours.
      </p>
      <p>
        <strong>Trends For Sale (TFS) CAN Bus Analyzer</strong> solves this by turning any modern Chromium web browser into a high-speed CAN diagnostic workbench with zero client installation.
      </p>

      <h2>2. Supported Hardware Architectures</h2>
      <p>The platform supports three distinct hardware connection models:</p>
      
      <div class="tech-spec-box">
        <h4>1. Vector Informatik Hardware (VN1610 / VN1630A / VN1640 / VN5620)</h4>
        <ul>
          <li><strong>Driver Interface:</strong> Vector XL Driver Library (<code>vxlapi64.dll</code> / <code>vxlapi.dll</code>).</li>
          <li><strong>Architecture:</strong> A lightweight local Python companion daemon (<code>vector_bridge.py</code>) running on <code>localhost:9002</code> binds to the Vector hardware and streams bidirectional CAN frames over ultra-low-latency WebSockets.</li>
          <li><strong>Baud Rates:</strong> 125 kbps, 250 kbps, 500 kbps, and 1 Mbps.</li>
        </ul>
      </div>

      <div class="tech-spec-box">
        <h4>2. Web Serial SLCAN (CANable, CandleLight, USBtin, STM32 SLCAN)</h4>
        <ul>
          <li><strong>Driver Interface:</strong> Browser-native Web Serial API.</li>
          <li><strong>Architecture:</strong> Zero companion daemon required. The browser connects directly to the USB CDC COM port and sends standard SLCAN ASCII commands (<code>O</code> to open, <code>C</code> to close, <code>S6</code> for 500k, <code>t12381122334455667788</code> for frames).</li>
        </ul>
      </div>

      <div class="tech-spec-box">
        <h4>3. Built-in Virtual ECU Simulator</h4>
        <ul>
          <li>Simulates real-world powertrain & telemetry packets (Engine RPM at ID <code>0x101</code>, Vehicle Speed at <code>0x102</code>, Coolant Temperature at <code>0x103</code>, and Battery SOC at <code>0x201</code>) with realistic sinusoidal curves and random jitter.</li>
        </ul>
      </div>

      <h2>3. Step-by-Step: Connecting Vector Hardware</h2>
      <p>Follow these steps to connect your Vector hardware to the TFS CAN Analyzer:</p>
      <ol class="guide-steps">
        <li>
          <strong>Ensure Vector Drivers are Installed:</strong> Download and install the latest Vector Driver Package from Vector's official portal to register <code>vxlapi64.dll</code> in your Windows System32 directory.
        </li>
        <li>
          <strong>Launch the TFS Vector Bridge:</strong> Navigate to <code>can_analysis/bridge/</code> and double-click <code>start_vector_bridge.bat</code>. It starts the WebSocket server on port 9002 and automatically selects Channel 0.
        </li>
        <li>
          <strong>Connect in Browser:</strong> Open the TFS CAN Analyzer, select <em>Vector Hardware (Bridge)</em> from the interface dropdown, set your target bit rate (e.g., 500 kbps), and click <strong>Connect Interface</strong>.
        </li>
      </ol>

      <h2>4. Real-Time DBC Telemetry Decoding</h2>
      <p>
        Raw hex payloads like <code>0x0E 0xA6 0x00 0x00</code> are difficult to interpret during real-time road testing. The TFS analyzer automatically decodes CAN IDs into engineering physical values:
      </p>
      <pre><code>// Example: Engine RPM Decoding from Arbitration ID 0x101
// Standard SAE Formula: RPM = ((Byte0 &lt;&lt; 8) | Byte1) * 0.25
uint16_t raw_rpm = (payload[0] &lt;&lt; 8) | payload[1];
float engine_rpm = raw_rpm * 0.25f; // Outputs: 3750.0 RPM</code></pre>

      <h2>5. Periodic Frame Injection & ECU Simulation</h2>
      <p>
        Need to wake up an instrument cluster on your desk? Use the <strong>Periodic Frame Injector</strong>. Set the Arbitration ID, enter up to 8 hex data bytes, specify a cyclic period (e.g., 20ms or 100ms), and start transmission. The injector runs smoothly in a high-precision browser timer loop.
      </p>
    `
  },
  {
    id: 'web-serial-guide',
    title: 'Mastering Web Serial: In-Browser Hardware Telemetry Without Drivers',
    slug: 'mastering-web-serial-hardware-telemetry-in-browser',
    category: 'hardware',
    categoryLabel: 'Hardware & Protocols',
    author: 'Venkatesh Chandra',
    authorRole: 'Senior Embedded Software Engineer',
    reviewedBy: 'Mani Kumari Amburu',
    date: 'October 23, 2026',
    readTime: '6 min read',
    featured: false,
    tags: ['Web Serial API', 'UART', 'ESP32', 'STM32', 'COM Port', 'Bootloader Reset'],
    summary: 'A deep-dive into the W3C Web Serial API. How to negotiate serial connections, handle binary/ASCII data streams, configure RTS/DTR pins to trigger ESP32 bootloader resets, and achieve zero-latency telemetry.',
    toolLink: '../serial_term/serial_term.html',
    toolName: 'Launch Serial Terminal Pro',
    content: `
      <h2>1. The Death of Desktop Terminal Clients</h2>
      <p>
        For decades, developers relied on desktop utilities like PuTTY, Tera Term, minicom, or screen to debug microcontroller UART output. While functional, they lacked rich data visualization, required platform-specific installs, and could not easily format hex telemetry alongside ASCII logs.
      </p>
      <p>
        The <strong>W3C Web Serial API</strong> bridges the browser directly to physical RS-232, USB-UART bridges (FTDI, CP2102, CH340, PL2303), and native USB CDC microcontrollers.
      </p>

      <h2>2. Opening a Port &amp; Setting Baud Rates</h2>
      <p>Connecting to a COM port requires one explicit user gesture (a button click) for browser security:</p>
      <pre><code>// Request user to select a serial port
const port = await navigator.serial.requestPort();

// Open port with custom baud rate and 8-N-1 framing
await port.open({
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  bufferSize: 16384
});</code></pre>

      <h2>3. DTR / RTS Line Control for ESP32 &amp; STM32 Bootloaders</h2>
      <p>
        One of the most frustrating aspects of serial debugging is physically pressing the reset button on your breadboard. In <strong>TFS Serial Terminal Pro</strong>, we implemented software-controlled pin toggling via <code>port.setSignals()</code>:
      </p>
      <pre><code>// Triggering an ESP32 hardware reset into firmware execution:
// DTR = HIGH, RTS = LOW pulls EN/RST pin low to reboot
await port.setSignals({ dataTerminalReady: true, requestToSend: false });
await new Promise(r => setTimeout(r, 100));
await port.setSignals({ dataTerminalReady: false, requestToSend: false });</code></pre>

      <h2>4. Safe Stream Reading Without Thread Locking</h2>
      <p>
        Reading high-throughput UART streams (such as 921,600 baud sensor telemetry) requires using an efficient readable stream reader with a text decoder stream to prevent dropping packets:
      </p>
      <pre><code>const textDecoder = new TextDecoderStream();
const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
const reader = textDecoder.readable.getReader();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  if (value) appendTerminalOutput(value);
}</code></pre>
    `
  },
  {
    id: 'embedded-c-arrays',
    title: 'From PNG to Pixels: Generating C-Arrays for Embedded OLEDs & TFT Screens',
    slug: 'png-to-c-arrays-embedded-oled-tft-display-graphics',
    category: 'embedded',
    categoryLabel: 'Embedded Displays',
    author: 'Venkatesh Chandra',
    authorRole: 'Senior Embedded Software Engineer',
    reviewedBy: 'Mani Kumari Amburu',
    date: 'October 22, 2026',
    readTime: '7 min read',
    featured: false,
    tags: ['Embedded Graphics', 'SSD1306', 'OLED', 'RGB565', 'ST7789', 'PROGMEM', 'TFT LCD'],
    summary: 'Master the memory layouts of embedded displays. How horizontal byte-packing works on monochrome 128x64 OLEDs, how to handle 16-bit RGB565 color endianness on TFT displays, and how to export C headers with PROGMEM flash placement.',
    toolLink: '../image_tools/image_studio.html',
    toolName: 'Launch Image & Asset Studio',
    content: `
      <h2>1. The Challenge of Microcontroller Display Assets</h2>
      <p>
        Microcontrollers like the ATmega328P, STM32F103, or ESP32 lack operating-system image decoders. They cannot directly load a <code>.png</code> or <code>.jpeg</code> file from an SD card without massive RAM overhead. Instead, display drivers (like Adafruit_GFX, U8g2, or TFT_eSPI) require raw binary pixel arrays compiled directly into microcontroller flash memory.
      </p>

      <h2>2. Monochrome OLEDs (SSD1306 / SH1106) Memory Layout</h2>
      <p>
        On a 128x64 monochrome OLED, every single pixel is represented by exactly <strong>1 bit</strong> (1 = Lit/White, 0 = Off/Black). A full 128x64 display buffer requires only:
      </p>
      <pre><code>(128 pixels * 64 pixels) / 8 bits = 1,024 Bytes (1 KB RAM)</code></pre>
      <p>
        In horizontal scanning format, each byte contains 8 consecutive horizontal pixels. The leftmost pixel is stored in the Most Significant Bit (bit 7), and the rightmost in the Least Significant Bit (bit 0):
      </p>
      <pre><code>// Example C Output from TFS Image Studio for SSD1306
#include &lt;stdint.h&gt;
#include &lt;avr/pgmspace.h&gt;

static const uint8_t battery_icon_16x16[] PROGMEM = {
  0x00, 0x00, 0x7F, 0xFE, 0x40, 0x02, 0x5F, 0xFA,
  0x5F, 0xFA, 0x5F, 0xFA, 0x5F, 0xFA, 0x40, 0x02,
  0x7F, 0xFE, 0x00, 0x00
};</code></pre>

      <h2>3. 16-Bit Color TFTs (ST7789 / ILI9341): The RGB565 Format</h2>
      <p>
        Full-color 24-bit images (8 bits Red, 8 bits Green, 8 bits Blue) consume 3 bytes per pixel. To save SPI bandwidth, TFT screens use **RGB565** (2 bytes per pixel):
      </p>
      <ul>
        <li><strong>Red:</strong> 5 bits (values 0 - 31)</li>
        <li><strong>Green:</strong> 6 bits (values 0 - 63, because the human eye is most sensitive to green)</li>
        <li><strong>Blue:</strong> 5 bits (values 0 - 31)</li>
      </ul>
      <pre><code>// Converting 24-bit RGB to 16-bit RGB565
uint16_t rgb565 = ((r &amp; 0xF8) &lt;&lt; 8) | ((g &amp; 0xFC) &lt;&lt; 3) | (b &gt;&gt; 3);

// Handling SPI Endianness Byte Swap if display colors look inverted:
uint16_t swapped = ((rgb565 &amp; 0xFF) &lt;&lt; 8) | ((rgb565 &gt;&gt; 8) &amp; 0xFF);</code></pre>

      <h2>4. Generating C-Arrays in One Click</h2>
      <p>
        Using the <strong>TFS Image &amp; Embedded Asset Studio</strong>, you can drag and drop any logo or icon, adjust the black/white binarization threshold, preview the exact quantized OLED/TFT rendering in real time, and copy the formatted <code>.h</code> header file.
      </p>
    `
  },
  {
    id: 'automotive-fuel-math',
    title: 'Automotive Fuel Metrics Explained: Math Behind KMPL, MPG US/UK & L/100km',
    slug: 'automotive-fuel-metrics-math-kmpl-mpg-lp100km',
    category: 'math',
    categoryLabel: 'Automotive Math',
    author: 'Venkatesh Chandra',
    authorRole: 'Senior Embedded Software Engineer',
    reviewedBy: 'Mani Kumari Amburu',
    date: 'October 21, 2026',
    readTime: '5 min read',
    featured: false,
    tags: ['Fuel Economy', 'KMPL', 'MPG US', 'MPG UK', 'L/100km', 'Automotive Engineering'],
    summary: 'Explore the mathematical formulations behind automotive fuel economy standards. Learn why L/100km is an inverse harmonic curve, the difference between US and Imperial gallons, and how vehicle trip computers calculate live fuel consumption.',
    toolLink: '../convertors/convertors_home_page.html',
    toolName: 'Open Fuel Economy Converter',
    content: `
      <h2>1. The Two Opposing Philosophies of Fuel Metrics</h2>
      <p>
        Across the automotive world, fuel efficiency is expressed in two fundamentally opposite ways:
      </p>
      <ul>
        <li><strong>Fuel Economy (Distance per Volume):</strong> How far can the vehicle travel on a fixed amount of fuel? (e.g., <code>km/L</code> in India/Japan, <code>MPG</code> in the US and UK). Higher is better.</li>
        <li><strong>Fuel Consumption (Volume per Distance):</strong> How much fuel does the vehicle consume to travel a fixed distance? (e.g., <code>L/100km</code> in Europe/Canada). Lower is better.</li>
      </ul>

      <h2>2. The US Gallon vs. Imperial Gallon Trap</h2>
      <p>
        A frequent point of confusion in vehicle road tests is the difference between US and UK Miles per Gallon. The US liquid gallon is based on the historic English wine gallon (231 cubic inches), whereas the UK Imperial gallon was defined by British statute in 1824:
      </p>
      <div class="tech-spec-box">
        <ul>
          <li><strong>1 US Gallon</strong> = 3.785411784 Liters</li>
          <li><strong>1 Imperial / UK Gallon</strong> = 4.54609 Liters (~20% larger than a US gallon)</li>
          <li><strong>1 Mile</strong> = 1.609344 Kilometers</li>
        </ul>
      </div>
      <p>
        Therefore, an identical car rated at <strong>30 MPG in the US</strong> will register as <strong>36.03 MPG in the UK</strong>!
      </p>

      <h2>3. Exact Conversion Mathematics</h2>
      <p>To convert between any standard, we normalize through base metric <strong>km/L (KMPL)</strong>:</p>
      <pre><code>// 1. KMPL to Miles per US Gallon:
MPG_US = KMPL * (3.785411784 / 1.609344) = KMPL * 2.35214583

// 2. KMPL to Miles per Imperial Gallon:
MPG_UK = KMPL * (4.54609 / 1.609344) = KMPL * 2.82480936

// 3. KMPL to Liters per 100km (Inverse Relationship):
L_per_100km = 100 / KMPL

// 4. MPG US to Liters per 100km:
L_per_100km = 235.214583 / MPG_US</code></pre>

      <h2>4. The L/100km "Illusion" and Why Fleets Use It</h2>
      <p>
        Improving from 10 MPG to 15 MPG saves <strong>33.3 gallons</strong> per 1,000 miles. But improving from 30 MPG to 35 MPG saves only <strong>4.8 gallons</strong> per 1,000 miles! Because MPG is non-linear, European regulators adopted <code>L/100km</code>, which accurately reflects linear fuel savings for fleet managers and consumers.
      </p>
    `
  },
  {
    id: 'client-side-pdf-workflows',
    title: 'Zero-Server Document Workflows: Merging & Splitting Datasheets in Browser RAM',
    slug: 'zero-server-client-side-pdf-datasheet-workflows',
    category: 'documents',
    categoryLabel: 'Document Security',
    author: 'Venkatesh Chandra',
    authorRole: 'Senior Embedded Software Engineer',
    reviewedBy: 'Mani Kumari Amburu',
    date: 'October 20, 2026',
    readTime: '5 min read',
    featured: false,
    tags: ['PDF Manipulation', 'WebAssembly', 'Client-Side Security', 'Datasheets', 'Zero Install'],
    summary: 'Why uploading confidential hardware datasheets and schematics to random online PDF converters is a massive security risk, and how pure client-side PDF manipulation in browser memory provides a zero-leakage alternative.',
    toolLink: '../pdf_tools/pdf_studio.html',
    toolName: 'Launch PDF Studio',
    content: `
      <h2>1. The Hidden Danger of Online PDF Converters</h2>
      <p>
        Hardware and firmware engineers frequently work with sensitive documentation: pre-release silicon datasheets under strict Non-Disclosure Agreements (NDAs), confidential multi-layer PCB schematics, and patent-pending mechanical drawings.
      </p>
      <p>
        When an engineer searches Google for <em>"split PDF"</em> or <em>"merge PDF"</em>, most popular websites upload the entire binary document to an unknown third-party cloud server where it is processed and stored on remote disks. This represents a severe intellectual property leak risk.
      </p>

      <h2>2. The TFS Zero-Server Architecture</h2>
      <p>
        In <strong>TFS PDF Studio</strong>, we adopted a 100% in-browser client-side execution model:
      </p>
      <div class="tech-spec-box">
        <h4>How Local Processing Works in Your Browser:</h4>
        <ol>
          <li><strong>Local File Reading:</strong> Files are read into JavaScript memory using the browser's native <code>FileReader</code> and <code>ArrayBuffer</code> APIs.</li>
          <li><strong>In-Memory Parsing:</strong> Binary cross-reference tables and object streams are parsed in RAM using pure JavaScript (<code>pdf-lib</code>).</li>
          <li><strong>Page Cloning &amp; Transformation:</strong> Pages, annotations, and vector streams are copied directly between documents in memory.</li>
          <li><strong>Direct Blob Download:</strong> The finalized PDF byte stream is serialized into a <code>Blob</code> object and downloaded directly to your local disk.</li>
        </ol>
      </div>

      <h2>3. Performance and Privacy Guarantees</h2>
      <p>
        Because no bytes travel over the internet, operations like merging three 50-page datasheets or extracting a pinout table complete in <strong>under 300 milliseconds</strong> — faster than uploading a single file to a traditional cloud converter!
      </p>
    `
  }
];
