const { google } = require('googleapis');

const googleDriveService = {
    // Initialize Google Drive API client
    async initialize() {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/drive.readonly']
        });
        const drive = google.drive({ version: 'v3', auth });
        return drive;
    },

    // Validate Google Drive document link
    async validateDocumentLink(link) {
        try {
            const drive = await this.initialize();
            const fileId = this.extractFileId(link);
            
            if (!fileId) {
                throw new Error('Invalid Google Drive link format');
            }

            const file = await drive.files.get({
                fileId,
                fields: 'id, name, mimeType'
            });

            // Check if it's a Google Document
            if (file.data.mimeType !== 'application/vnd.google-apps.document') {
                throw new Error('Link must point to a Google Document');
            }

            return {
                valid: true,
                fileId,
                fileName: file.data.name
            };
        } catch (error) {
            console.error('Error validating Google Drive link:', error);
            return {
                valid: false,
                error: error.message
            };
        }
    },

    // Extract file ID from Google Drive URL
    extractFileId(url) {
        const regex = /[-\w]{25,}/;
        const match = url.match(regex);
        return match ? match[0] : null;
    }
};

module.exports = googleDriveService;
