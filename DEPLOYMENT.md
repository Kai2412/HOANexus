# HOA Nexus Deployment Guide

## Fly.io Deployment

### Prerequisites
1. Install the Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Create a Fly.io account: https://fly.io/app/sign-up

### Environment Variables
You'll need to set these environment variables in Fly.io:

```bash
# Database Configuration
DB_SERVER=your-database-server.com
DB_DATABASE=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
NODE_ENV=production
```

### Deployment Steps

1. **Login to Fly.io:**
   ```bash
   flyctl auth login
   ```

2. **Launch the app (from the project root):**
   ```bash
   flyctl launch
   ```
   - Choose a unique app name
   - Select a region (Dallas/DFW recommended for Texas-based HOAs)
   - Don't deploy immediately when prompted

3. **Set environment variables:**
   ```bash
   flyctl secrets set DB_SERVER=your-server
   flyctl secrets set DB_DATABASE=your-database
   flyctl secrets set DB_USER=your-user
   flyctl secrets set DB_PASSWORD=your-password
   flyctl secrets set JWT_SECRET=your-jwt-secret
   flyctl secrets set DB_ENCRYPT=true
   flyctl secrets set DB_TRUST_SERVER_CERTIFICATE=false
   ```

4. **Deploy the application:**
   ```bash
   flyctl deploy
   ```

5. **Check the deployment:**
   ```bash
   flyctl status
   flyctl logs
   ```

### Database Setup
Make sure your SQL Server database is accessible from the internet and has the proper firewall rules configured to allow connections from Fly.io.

### Custom Domain (Optional)
To use a custom domain:
```bash
flyctl certs add your-domain.com
```

### Monitoring
- View logs: `flyctl logs`
- Scale app: `flyctl scale count 2`
- Check status: `flyctl status`
