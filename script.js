document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const startButton = document.getElementById('start-test');
    const speedValue = document.getElementById('speed-value');
    const testStatus = document.getElementById('test-status');
    const downloadSpeed = document.getElementById('download-speed');
    const uploadSpeed = document.getElementById('upload-speed');
    const pingValue = document.getElementById('ping');
    const jitterValue = document.getElementById('jitter');
    const loadingIndicator = document.querySelector('.loading-indicator');
    const advancedMetricsSection = document.getElementById('advanced-metrics');
    const toggleAdvancedButton = document.getElementById('toggle-advanced');
    const historySection = document.getElementById('history-section');
    const toggleHistoryButton = document.getElementById('toggle-history');
    const historyData = document.getElementById('history-data');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    // Advanced metrics elements
    const rttValue = document.getElementById('rtt');
    const packetLossValue = document.getElementById('packet-loss');
    const dnsLookupValue = document.getElementById('dns-lookup');
    const tcpConnectionValue = document.getElementById('tcp-connection');
    const tlsHandshakeValue = document.getElementById('tls-handshake');
    const serverLocationValue = document.getElementById('server-location');
    const connectionTypeValue = document.getElementById('connection-type');
    const ipAddressValue = document.getElementById('ip-address');

    // Speed test history
    let testHistory = JSON.parse(localStorage.getItem('speedTestHistory')) || [];
    
    // Chart
    let speedChart;
    const ctx = document.getElementById('speed-chart').getContext('2d');
    
    // Test configuration
    const testConfig = {
        downloadSizes: [5, 10, 20, 50], // MB
        uploadSizes: [2, 5, 10],        // MB
        pingAttempts: 10,
        testDuration: 10, // seconds
        servers: [
            { url: 'https://speed.cloudflare.com/__down', name: 'Cloudflare' },
            { url: 'https://httpbin.org/stream-bytes', name: 'HTTPBin' },
            { url: 'https://eu.httpbin.org/stream-bytes', name: 'EU-HTTPBin' },
            { url: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png', name: 'Google' },
            { url: 'https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js', name: 'GoogleCDN' },
            { url: 'https://cdn.jsdelivr.net/npm/jquery/dist/jquery.min.js', name: 'JSDelivr' }
        ],
        selectedServer: 0,
        fallbackToSimulation: true // Enable simulation fallback if real tests fail
    };

    // Toggle advanced metrics
    toggleAdvancedButton.addEventListener('click', () => {
        advancedMetricsSection.classList.toggle('hidden');
        toggleAdvancedButton.textContent = advancedMetricsSection.classList.contains('hidden') 
            ? 'Show Advanced Metrics' 
            : 'Hide Advanced Metrics';
    });

    // Toggle history section
    toggleHistoryButton.addEventListener('click', () => {
        historySection.classList.toggle('hidden');
        toggleHistoryButton.textContent = historySection.classList.contains('hidden') 
            ? 'Show Test History' 
            : 'Hide Test History';
    });

    // Theme toggle functionality
    function initTheme() {
        // Check for saved theme preference or use system preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.remove('light-mode');
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.classList.add('light-mode');
        }
    }
    
    // Initialize theme on page load
    initTheme();
    
    // Theme toggle event listener
    themeToggleBtn.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark-mode')) {
            // Switch to light mode
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            // Switch to dark mode
            document.documentElement.classList.remove('light-mode');
            document.documentElement.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Initialize the speed chart
    function initChart() {
        speedChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Download Speed (Mbps)',
                        data: [],
                        borderColor: '#0077ff',
                        backgroundColor: 'rgba(0, 119, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Upload Speed (Mbps)',
                        data: [],
                        borderColor: '#00ccff',
                        backgroundColor: 'rgba(0, 204, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Speed (Mbps)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    // Initialize chart on page load
    initChart();

    // Load test history
    function loadTestHistory() {
        historyData.innerHTML = '';
        
        testHistory.slice().reverse().forEach(test => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${test.date}</td>
                <td>${test.download} Mbps</td>
                <td>${test.upload} Mbps</td>
                <td>${test.ping} ms</td>
                <td>${test.server}</td>
            `;
            historyData.appendChild(row);
        });
    }

    // Save test results to history
    function saveTestResult(download, upload, ping, server) {
        const now = new Date();
        const dateStr = now.toLocaleString();
        
        const testResult = {
            date: dateStr,
            download: download.toFixed(2),
            upload: upload.toFixed(2),
            ping: ping.toFixed(0),
            server: server
        };
        
        testHistory.push(testResult);
        if (testHistory.length > 10) {
            testHistory.shift(); // Keep only the 10 most recent tests
        }
        
        localStorage.setItem('speedTestHistory', JSON.stringify(testHistory));
        loadTestHistory();
    }

    // Load history on page load
    loadTestHistory();

    // Get connection information
    async function getConnectionInfo() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            serverLocationValue.textContent = `${data.city}, ${data.country_name}`;
            ipAddressValue.textContent = data.ip;
            
            // Detect connection type (this is an approximation)
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                connectionTypeValue.textContent = connection.effectiveType || 'Unknown';
            }
        } catch (error) {
            console.error('Error fetching connection info:', error);
        }
    }

    // Simulate DNS lookup and connection times
    function simulateConnectionMetrics() {
        // These are simulated values for demonstration, in a real app you'd use
        // the Navigation Timing API or other methods to measure these
        const dnsTime = Math.random() * 30 + 10;
        const tcpTime = Math.random() * 40 + 20;
        const tlsTime = Math.random() * 50 + 30;
        
        dnsLookupValue.textContent = `${dnsTime.toFixed(0)} ms`;
        tcpConnectionValue.textContent = `${tcpTime.toFixed(0)} ms`;
        tlsHandshakeValue.textContent = `${tlsTime.toFixed(0)} ms`;
    }

    // Measure ping (RTT)
    async function measurePing() {
        testStatus.textContent = 'Measuring ping...';
        const server = testConfig.servers[testConfig.selectedServer];
        const pingTimes = [];
        const jitterValues = [];
        
        console.log(`Measuring ping to ${server.name}...`);
        
        for (let i = 0; i < testConfig.pingAttempts; i++) {
            try {
                // Use different URL for ping test based on server type
                let pingUrl = server.url;
                if (server.name === 'HTTPBin' || server.name === 'EU-HTTPBin') {
                    pingUrl = `${server.url}/1024?t=${Date.now()}`;
                } else {
                    pingUrl = `${pingUrl}?ping=${Date.now()}`;
                }
                
                const requestStart = performance.now();
                await fetch(pingUrl, { 
                    mode: 'no-cors',
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store'
                    }
                });
                const requestEnd = performance.now();
                const pingTime = requestEnd - requestStart;
                
                console.log(`Ping attempt ${i+1}: ${pingTime.toFixed(1)}ms`);
                pingTimes.push(pingTime);
                
                // Calculate jitter if we have at least two ping measurements
                if (pingTimes.length > 1) {
                    const jitter = Math.abs(pingTimes[pingTimes.length - 1] - pingTimes[pingTimes.length - 2]);
                    jitterValues.push(jitter);
                }
                
                // Small delay between ping attempts
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Ping attempt ${i+1} failed:`, error);
                // Use a high value to indicate failure
                pingTimes.push(500); // 500ms as placeholder for failed attempt
                
                if (pingTimes.length > 1) {
                    jitterValues.push(100); // Add some jitter value for failed attempts
                }
            }
        }
        
        // Calculate average ping, removing outliers
        pingTimes.sort((a, b) => a - b);
        
        // Remove the highest and lowest values if we have enough measurements
        const filteredPings = pingTimes.length > 4 
            ? pingTimes.slice(1, -1) 
            : pingTimes;
            
        const avgPing = filteredPings.reduce((sum, ping) => sum + ping, 0) / filteredPings.length;
        
        // Calculate average jitter
        const avgJitter = jitterValues.length > 0
            ? jitterValues.reduce((sum, jitter) => sum + jitter, 0) / jitterValues.length
            : 0;
        
        console.log(`Average ping: ${avgPing.toFixed(1)}ms, Jitter: ${avgJitter.toFixed(1)}ms`);
        
        // Update UI
        pingValue.textContent = `${avgPing.toFixed(0)} ms`;
        jitterValue.textContent = `${avgJitter.toFixed(0)} ms`;
        rttValue.textContent = `${avgPing.toFixed(0)} ms`;
        
        // Calculate packet loss (percentage of failed pings)
        const failedPings = pingTimes.filter(ping => ping >= 500).length;
        const packetLoss = (failedPings / testConfig.pingAttempts) * 100;
        packetLossValue.textContent = `${packetLoss.toFixed(0)}%`;
        
        return avgPing;
    }

    // Measure download speed
    async function measureDownloadSpeed() {
        testStatus.textContent = 'Measuring download speed...';
        const server = testConfig.servers[testConfig.selectedServer];
        let totalBytesDownloaded = 0;
        const startTime = performance.now();
        const endTime = startTime + (testConfig.testDuration * 1000);
        
        const downloadData = [];
        
        while (performance.now() < endTime) {
            try {
                const size = testConfig.downloadSizes[Math.floor(Math.random() * testConfig.downloadSizes.length)];
                // Add timestamp to avoid cache
                let requestUrl;
                
                // Build URL based on server type
                switch(server.name) {
                    case 'Cloudflare':
                        // Cloudflare download endpoint requires bytes parameter
                        requestUrl = `${server.url}?bytes=${size * 1024 * 1024}&cachebust=${Date.now()}`;
                        break;
                    case 'HTTPBin':
                    case 'EU-HTTPBin':
                        // HTTPBin requires bytes directly in URL
                        const sizeInBytes = size * 1024 * 1024;
                        requestUrl = `${server.url}/${sizeInBytes}?cachebust=${Date.now()}`;
                        break;
                    case 'Google':
                    case 'GoogleCDN':
                    case 'JSDelivr':
                        // For static resources, just add cache busting
                        requestUrl = `${server.url}?cachebust=${Date.now()}`;
                        break;
                    default:
                        requestUrl = `${server.url}?cachebust=${Date.now()}`;
                }
                
                console.log(`Download test from: ${server.name}, URL: ${requestUrl}`);
                
                // Set up fetch with AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                const fetchStart = performance.now();
                const response = await fetch(requestUrl, { 
                    cache: 'no-store',
                    signal: controller.signal
                });
                
                // Handle response
                if (!response.ok) {
                    console.error(`Server returned error status: ${response.status}`);
                    throw new Error(`HTTP error ${response.status}`);
                }
                
                // Get data
                const blob = await response.blob();
                clearTimeout(timeoutId);
                
                const fetchEnd = performance.now();
                const downloadTime = (fetchEnd - fetchStart) / 1000; // in seconds
                
                // Use actual download size from blob
                const bytes = blob.size;
                console.log(`Downloaded ${bytes} bytes in ${downloadTime.toFixed(2)}s (${server.name})`);
                
                if (bytes > 0) {
                    totalBytesDownloaded += bytes;
                    
                    // Calculate current speed
                    const elapsedSecs = (performance.now() - startTime) / 1000;
                    const speedMbps = (totalBytesDownloaded * 8) / (1000000 * elapsedSecs);
                    
                    // Update UI
                    speedValue.textContent = speedMbps.toFixed(2);
                    downloadSpeed.textContent = `${speedMbps.toFixed(2)} Mbps`;
                    
                    // Record data point for chart
                    downloadData.push({
                        time: new Date().toLocaleTimeString(),
                        speed: speedMbps
                    });
                } else {
                    console.warn(`Zero bytes downloaded from ${server.name}, skipping measurement`);
                }
            } catch (error) {
                console.error(`Download test error (${server.name}):`, error);
                
                // Try next server on failure
                const nextServer = (testConfig.selectedServer + 1) % testConfig.servers.length;
                console.log(`Switching to server: ${testConfig.servers[nextServer].name}`);
                testConfig.selectedServer = nextServer;
            }
            
            // Short delay to prevent browser freeze
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const totalElapsedSecs = (performance.now() - startTime) / 1000;
        let finalSpeedMbps = 0;
        
        if (totalElapsedSecs > 0 && totalBytesDownloaded > 0) {
            finalSpeedMbps = (totalBytesDownloaded * 8) / (1000000 * totalElapsedSecs);
            console.log(`Final real download speed: ${finalSpeedMbps.toFixed(2)} Mbps (${totalBytesDownloaded} bytes in ${totalElapsedSecs.toFixed(2)}s)`);
        } else {
            console.error('Download test failed to collect any data');
            throw new Error('Failed to measure download speed');
        }
        
        // Update chart with download data
        downloadData.forEach((data, index) => {
            if (index % 3 === 0 || index === downloadData.length - 1) { // Every 3rd point plus the last one
                speedChart.data.labels.push(data.time);
                speedChart.data.datasets[0].data.push(data.speed);
            }
        });
        
        speedChart.update();
        
        return finalSpeedMbps;
    }

    // Measure upload speed
    async function measureUploadSpeed() {
        testStatus.textContent = 'Measuring upload speed...';
        const server = testConfig.servers[testConfig.selectedServer];
        let totalBytesUploaded = 0;
        const startTime = performance.now();
        const endTime = startTime + (testConfig.testDuration * 1000);
        
        const uploadData = [];
        let realUploadPerformed = false;
        
        // Create test servers specifically for uploads
        const uploadEndpoints = [
            'https://httpbin.org/post',
            'https://eu.httpbin.org/post'
        ];
        let currentEndpoint = 0;
        
        console.log("Starting upload test...");
        
        while (performance.now() < endTime) {
            try {
                const size = testConfig.uploadSizes[Math.floor(Math.random() * testConfig.uploadSizes.length)];
                
                // Create a blob with random data to upload
                const randomData = new Uint8Array(size * 1024 * 1024);
                for (let i = 0; i < randomData.length; i += 4096) {
                    randomData[i] = Math.floor(Math.random() * 256);
                }
                const blob = new Blob([randomData]);
                
                // Select an appropriate endpoint for uploads
                const uploadUrl = uploadEndpoints[currentEndpoint];
                console.log(`Uploading ${size}MB to ${uploadUrl}`);
                
                // Set up fetch with AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
                
                const fetchStart = performance.now();
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: blob,
                    headers: {
                        'Content-Type': 'application/octet-stream'
                    },
                    signal: controller.signal,
                    cache: 'no-store'
                });
                
                clearTimeout(timeoutId);
                const fetchEnd = performance.now();
                
                if (!response.ok) {
                    console.error(`Upload server returned error: ${response.status}`);
                    throw new Error(`HTTP error ${response.status}`);
                }
                
                const uploadTime = (fetchEnd - fetchStart) / 1000; // in seconds
                const bytes = size * 1024 * 1024; // Size in bytes
                
                console.log(`Uploaded ${bytes} bytes in ${uploadTime.toFixed(2)}s`);
                
                totalBytesUploaded += bytes;
                realUploadPerformed = true;
                
                const elapsedSecs = (performance.now() - startTime) / 1000;
                const speedMbps = (totalBytesUploaded * 8) / (1000000 * elapsedSecs);
                
                speedValue.textContent = speedMbps.toFixed(2);
                uploadSpeed.textContent = `${speedMbps.toFixed(2)} Mbps`;
                
                // Record data point for chart
                uploadData.push({
                    time: new Date().toLocaleTimeString(),
                    speed: speedMbps
                });
            } catch (error) {
                console.error('Upload test error:', error);
                
                // Try the next endpoint
                currentEndpoint = (currentEndpoint + 1) % uploadEndpoints.length;
                console.log(`Switching to upload endpoint: ${uploadEndpoints[currentEndpoint]}`);
            }
            
            // Short delay to prevent browser freeze
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const totalElapsedSecs = (performance.now() - startTime) / 1000;
        let finalSpeedMbps = 0;
        
        if (totalElapsedSecs > 0 && totalBytesUploaded > 0 && realUploadPerformed) {
            finalSpeedMbps = (totalBytesUploaded * 8) / (1000000 * totalElapsedSecs);
            console.log(`Final real upload speed: ${finalSpeedMbps.toFixed(2)} Mbps (${totalBytesUploaded} bytes in ${totalElapsedSecs.toFixed(2)}s)`);
        } else {
            console.error('Upload test failed to collect reliable data');
            throw new Error('Failed to measure upload speed');
        }
        
        // Update chart with upload data
        uploadData.forEach((data, index) => {
            if (index % 3 === 0 || index === uploadData.length - 1) { // Every 3rd point plus the last one
                if (speedChart.data.datasets[1].data.length < speedChart.data.labels.length) {
                    // If we already have a label from download test
                    speedChart.data.datasets[1].data.push(data.speed);
                } else {
                    // Add new label and data point
                    speedChart.data.labels.push(data.time);
                    speedChart.data.datasets[1].data.push(data.speed);
                }
            }
        });
        speedChart.update();
        
        return finalSpeedMbps;
    }

    // Function to choose the best server based on ping
    async function selectBestServer() {
        testStatus.textContent = 'Selecting best server...';
        let bestServer = 0;
        let bestPing = Number.MAX_VALUE;
        let serverResults = [];
        
        console.log('Starting server selection test...');
        
        for (let i = 0; i < testConfig.servers.length; i++) {
            try {
                const server = testConfig.servers[i];
                console.log(`Testing server: ${server.name} (${server.url})`);
                
                // Use different URL for ping test based on server type
                let pingUrl = server.url;
                if (server.name === 'HTTPBin' || server.name === 'EU-HTTPBin') {
                    pingUrl = `${server.url}/1024?t=${Date.now()}`;
                } else {
                    pingUrl = `${server.url}?ping=${Date.now()}`;
                }
                
                const start = performance.now();
                const response = await fetch(pingUrl, { 
                    mode: 'no-cors',
                    cache: 'no-store',
                    timeout: 3000, // 3 second timeout
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                const ping = performance.now() - start;
                
                console.log(`Server ${server.name} ping: ${ping.toFixed(0)}ms`);
                
                serverResults.push({
                    index: i,
                    name: server.name,
                    ping: ping
                });
                
                if (ping < bestPing) {
                    bestPing = ping;
                    bestServer = i;
                }
            } catch (error) {
                console.warn(`Server ${testConfig.servers[i].name} unreachable:`, error);
                serverResults.push({
                    index: i,
                    name: testConfig.servers[i].name,
                    ping: Number.MAX_VALUE,
                    error: error.message
                });
            }
        }
        
        // Sort servers by ping time
        serverResults.sort((a, b) => a.ping - b.ping);
        
        // Log all server results
        console.log('Server test results (sorted by ping):');
        serverResults.forEach(result => {
            if (result.ping === Number.MAX_VALUE) {
                console.log(`- ${result.name}: Failed (${result.error})`);
            } else {
                console.log(`- ${result.name}: ${result.ping.toFixed(0)}ms`);
            }
        });
        
        // If all servers failed, use the first one
        if (bestPing === Number.MAX_VALUE) {
            console.warn('All servers failed ping test. Using first server.');
            bestServer = 0;
            bestPing = 999;
        }
        
        testConfig.selectedServer = bestServer;
        console.log(`Selected server: ${testConfig.servers[bestServer].name} with ping ${bestPing.toFixed(0)}ms`);
        
        return bestServer;
    }

    // Start speed test
    async function startSpeedTest() {
        // Reset values
        speedValue.textContent = '0';
        downloadSpeed.textContent = '0 Mbps';
        uploadSpeed.textContent = '0 Mbps';
        pingValue.textContent = '0 ms';
        jitterValue.textContent = '0 ms';
        
        // Reset chart
        speedChart.data.labels = [];
        speedChart.data.datasets[0].data = [];
        speedChart.data.datasets[1].data = [];
        speedChart.update();
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        startButton.disabled = true;
        
        try {
            console.log("=== STARTING SPEED TEST ===");
            
            // Select the best server
            await selectBestServer();
            
            // Get server info for the test
            const serverName = testConfig.servers[testConfig.selectedServer].name;
            testStatus.textContent = `Selected server: ${serverName}`;
            
            // Get connection info
            try {
                await getConnectionInfo();
            } catch (connectionError) {
                console.error("Connection info error:", connectionError);
                // Continue the test even if connection info fails
            }
            
            // Simulate connection metrics
            simulateConnectionMetrics();
            
            // Measure ping
            let pingResult;
            try {
                pingResult = await measurePing();
                console.log(`Ping test completed: ${pingResult.toFixed(0)} ms`);
            } catch (pingError) {
                console.error("Ping test error:", pingError);
                pingResult = 0; // Continue even if ping fails
            }
            
            // Measure download speed
            testStatus.textContent = 'Starting download test...';
            let downloadResult;
            let downloadError = null;
            try {
                downloadResult = await measureDownloadSpeed();
                console.log(`Download test completed: ${downloadResult.toFixed(2)} Mbps`);
            } catch (error) {
                downloadError = error;
                console.error("Download test failed:", error);
                
                // Try each server one by one
                for (let i = 0; i < testConfig.servers.length; i++) {
                    try {
                        testConfig.selectedServer = i;
                        const currentServer = testConfig.servers[i];
                        testStatus.textContent = `Trying server: ${currentServer.name}`;
                        console.log(`Trying download test with server: ${currentServer.name}`);
                        
                        downloadResult = await measureDownloadSpeed();
                        if (downloadResult > 0) {
                            console.log(`Download test succeeded with ${currentServer.name}: ${downloadResult.toFixed(2)} Mbps`);
                            downloadError = null;
                            break;
                        }
                    } catch (retryError) {
                        console.error(`Download retry failed with ${testConfig.servers[i].name}:`, retryError);
                    }
                }
                
                if (downloadError) {
                    throw new Error("All download test attempts failed");
                }
            }
            
            // Update download speed display
            downloadSpeed.textContent = `${downloadResult.toFixed(2)} Mbps`;
            
            // Measure upload speed
            testStatus.textContent = 'Starting upload test...';
            let uploadResult;
            try {
                uploadResult = await measureUploadSpeed();
                console.log(`Upload test completed: ${uploadResult.toFixed(2)} Mbps`);
            } catch (uploadError) {
                console.error("Upload test failed:", uploadError);
                throw new Error("Upload test failed");
            }
            
            // Save test result only if all tests succeeded
            saveTestResult(downloadResult, uploadResult, pingResult, serverName);
            
            // Update status
            testStatus.textContent = 'Test completed successfully';
            console.log("=== TEST COMPLETED SUCCESSFULLY ===");
        } catch (error) {
            console.error('Speed test error:', error);
            testStatus.textContent = 'Error: ' + error.message;
            console.log("=== TEST FAILED ===");
        } finally {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            startButton.disabled = false;
        }
    }

    // Start test button click handler
    startButton.addEventListener('click', startSpeedTest);

    // Show initial connection info
    getConnectionInfo();
}); 