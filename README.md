# Mediflex POS System

Pharmacy Point of Sale desktop application built with React, Vite, and Electron.

## Windows 8.1 / 7 Compatibility

This application is configured for full compatibility with **Windows 8.1** (and Windows 7 SP1) as well as Windows 10/11:
- **Electron 22.3.27**: The final official Electron release supporting Windows 7, 8, and 8.1 (Chromium 108 / Node 16.17.1).
- **Architecture Support**: Configured to package both **x64** (64-bit) and **ia32** (32-bit) installers and portable standalone binaries.
- **Hardware Acceleration Flags**: Disables `CalculateNativeWinOcclusion` and provides sandbox fallbacks to prevent blank/black screens on older legacy graphics chipsets.
- **Single Instance Locking**: Prevents accidental multiple instances on POS terminals.

## Scripts

- `npm run dev`: Start Vite development server
- `npm run build`: Build frontend assets targeting Chromium 108
- `npm run electron:dev`: Run Electron in development mode
- `npm run electron:build`: Compile Electron TypeScript files to CommonJS
- `npm run electron:dist`: Build production installer for Windows
- `npm run electron:dist:all`: Build dual-architecture installer (both x64 and ia32)
- `npm run electron:dist:x64`: Build 64-bit Windows installer
- `npm run electron:dist:ia32`: Build 32-bit Windows installer (recommended for 32-bit POS terminals)

