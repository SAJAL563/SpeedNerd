# SpeedNerd - Detailed Internet Speed Test

A modern, detailed internet speed testing website similar to fast.com but with advanced metrics for tech enthusiasts.

## Features

- Clean, responsive UI
- Measures download and upload speeds
- Ping and jitter measurements
- Detailed metrics for technical users:
  - Round Trip Time (RTT)
  - Packet Loss
  - DNS Lookup Time
  - TCP Connection Time
  - TLS Handshake Time
  - Server Location
  - Connection Type
  - IP Address
- Historical test results stored locally
- Real-time speed chart visualization
- Mobile-friendly design

## Running the Website

Simply open the `index.html` file in a web browser. No server setup is required as this is a client-side application.

## How It Works

This speed test application works by:

1. Measuring ping by sending multiple small requests and measuring response time
2. Testing download speed by downloading files of various sizes and measuring throughput
3. Testing upload speed by uploading data and measuring throughput
4. Collecting and displaying additional network metrics
5. Storing test history in localStorage

Note: This is a client-side simulation of a speed test. For the most accurate results, a real speed test requires dedicated test servers and more sophisticated network measurements. This implementation uses approximations and simulations for educational purposes.

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Chart.js for data visualization
- Web APIs:
  - Fetch API
  - Performance API
  - Network Information API

## Limitations

- The speed test accuracy depends on the test servers used and browser capabilities
- Upload tests may be less accurate than download tests due to browser limitations
- Some advanced metrics are simulated for demonstration purposes
- Results may vary compared to dedicated speed testing services

## License

MIT License 