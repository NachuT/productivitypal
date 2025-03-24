const { contextBridge, desktopCapturer } = require('electron');

// Expose a single API object with all needed functions
contextBridge.exposeInMainWorld('electronAPI', {
    captureScreen: async () => {
        try {
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width: 1920, height: 1080 }
            });
            
            if (!sources || sources.length === 0) {
                throw new Error('No screen sources found');
            }
            
            return sources[0].thumbnail.toDataURL();
        } catch (error) {
            console.error('Screen capture error:', error);
            throw error;
        }
    }
}); 