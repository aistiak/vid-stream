const crypto = require('crypto');

const generateToken = () => {
    const secretKey = process.env.JWT_SECRET_KEY || 'secret';
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create payload as a string
    const payload = JSON.stringify({
        iat: timestamp,
        exp: timestamp + (60 * 60), // Token expires in 1 hour
    });

    // Generate HMAC signature
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(payload);
    const signature = hmac.digest('base64url');

    // Combine payload and signature
    const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;
    return token;
};

const verifyToken = (token) => {
    const secretKey = process.env.JWT_SECRET_KEY || 'secret';
    
    try {
        // Split token into payload and signature
        const [payloadBase64, receivedSignature] = token.split('.');
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString());
        
        // Verify signature
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(Buffer.from(payloadBase64, 'base64url').toString());
        const expectedSignature = hmac.digest('base64url');
        
        if (receivedSignature !== expectedSignature) {
            return false;
        }

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp < currentTime) {
            return false;
        }
        
        return true;
    } catch (error) {
        return false;
    }
};

const http = require('http');

const server = http.createServer((req, res) => {
    // Log incoming request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    // Log request headers
    console.log('Request Headers:');
    for (const [header, value] of Object.entries(req.headers)) {
        console.log(`${header}: ${value}`);
    }

    try {
        res.setHeader('Content-Type', 'application/json');

        // Generate token endpoint
        if (req.method === 'POST' && req.url === '/generate-token') {
            try {
                const token = generateToken();
                res.statusCode = 200;
                res.end(JSON.stringify({ token }));
                return;
            } catch (error) {
                console.error('Error generating token:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal server error' }));
                return;
            }
        }

        // Verify token endpoint
        if (req.method === 'GET' && req.url.startsWith('/verify-token')) {
            try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                const originalUri = req.headers['x-original-uri'] || '';
                const originalUrl = new URL(originalUri, `http://${req.headers.host}`);
                const token = originalUrl.searchParams.get('tok');

                if (!token) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: 'Token is required' }));
                    return;
                }

                const isValid = verifyToken(token);
                console.log({token})
                console.log(` --- verified ---`)
                res.statusCode = isValid? 200 : 400;
                res.end(JSON.stringify({ isValid }));   
            } catch (error) {
                console.error('Error verifying token:', error);
                console.log(` --- invalid request ---`)
                res.statusCode = 502;
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
            return;
        }

        // Handle 404
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));

    } catch (error) {
        console.error('Unhandled server error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
});
