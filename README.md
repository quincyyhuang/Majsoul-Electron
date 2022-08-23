# Majsoul Electron

A wrapper around Majsoul web client.

## Features

- Supports building natively on M1 macs. Also supports Windows and Linux but it's recommended to use either Steam or PC clients on these two platforms.
- Supports ZH/JP/EN servers.
- Supports taking screenshots. Screenshots will be saved to desktop.
- Supports fixed window resolution and aspect ratio for better experience.
- Disabled browser color correction for brighter colors on some devices.

## Disclaimer

I built this app because as of now Majsoul does not have a native client for M1 macs. The client from Steam is x64 and does not run very well on M1 macs. And I do not like having to resize my browser window so accurately to avoid the black bars because of the aspect ratio.

This client does not add any features or plugins to the original Majsoul web client. Still, use at your own risk. Author is absolutely not responsible for any kind of loss (including account suspension) of users.

## Test and Build

1. Clone this repository.
2. `npm install` to install all the dependencies.
3. `npm start` to run locally.
4. `npm run build` to package the app using electron-builder.