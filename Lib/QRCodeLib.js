const QRCode = require('qrcode');

class qrGenerator {
    constructor({ imagePath }) {
        // Mantido por compatibilidade com chamadas existentes. O renderizador
        // puro JavaScript não incorpora logo no centro do QR Code.
        this.imagePath = imagePath;
    }

    generate = async function (data) {
        try {
            const png = await QRCode.toBuffer(data, {
                type: 'png',
                width: 1000,
                margin: 2,
                color: { dark: '#0000ff', light: '#ffffff' },
            });
            return { status: 'success', response: png.toString('base64') };
        } catch (error) {
            return { status: 'error', response: error };
        }
    }
}

module.exports.qrGenerator = qrGenerator;