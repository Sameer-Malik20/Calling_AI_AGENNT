#!/bin/bash

# CallingAgent Ubuntu Setup Script
# This script creates required directories and sets proper permissions for Asterisk

echo "=== CallingAgent Ubuntu Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Create required directories
echo "Creating directories..."
mkdir -p /var/lib/asterisk/sounds/custom
mkdir -p /tmp/asterisk-recordings
mkdir -p /var/spool/asterisk/monitor
mkdir -p /var/lib/asterisk/sounds/en
mkdir -p /var/lib/asterisk/sounds/custom/tts
mkdir -p /var/lib/asterisk/sounds/custom/recordings

echo "Directories created successfully."
echo ""

# Set ownership
echo "Setting ownership..."
chown -R asterisk:asterisk /var/lib/asterisk/sounds/custom
chown -R asterisk:asterisk /tmp/asterisk-recordings
chown -R asterisk:asterisk /var/spool/asterisk/monitor
chown -R asterisk:asterisk /var/lib/asterisk/sounds/en
chown -R asterisk:asterisk /var/lib/asterisk/sounds/custom/tts
chown -R asterisk:asterisk /var/lib/asterisk/sounds/custom/recordings

echo "Ownership set successfully."
echo ""

# Set permissions
echo "Setting permissions..."
chmod -R 755 /var/lib/asterisk/sounds/custom
chmod -R 755 /tmp/asterisk-recordings
chmod -R 755 /var/spool/asterisk/monitor
chmod -R 755 /var/lib/asterisk/sounds/en
chmod -R 755 /var/lib/asterisk/sounds/custom/tts
chmod -R 755 /var/lib/asterisk/sounds/custom/recordings

echo "Permissions set successfully."
echo ""

# Verify directories
echo "Verifying directories..."
ls -la /var/lib/asterisk/sounds/custom
ls -la /tmp/asterisk-recordings
ls -la /var/spool/asterisk/monitor

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Copy Asterisk configuration files to /etc/asterisk/"
echo "2. Reload Asterisk: asterisk -rx 'module reload'"
echo "3. Test directory permissions"
