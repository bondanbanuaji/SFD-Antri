import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './src/lib/socket';
import { networkInterfaces } from 'os';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen on all network interfaces
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Get local IP address
function getLocalIP(): string {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            // Skip internal and non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Initialize Socket.io
    initSocketServer(server);

    server.listen(port, hostname, () => {
        const localIP = getLocalIP();
        console.log('');
        console.log('🚀 Server started successfully!');
        console.log('');
        console.log('   Local:    http://localhost:' + port);
        console.log('   Network:  http://' + localIP + ':' + port);
        console.log('');
        console.log('✅ Socket.io server initialized');
        console.log('');
        console.log('📱 Access from other devices on your network:');
        console.log('   http://' + localIP + ':' + port);
        console.log('');
    });
});
