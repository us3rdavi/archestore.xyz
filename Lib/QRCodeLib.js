const { QRCodeStyling } = require('qr-code-styling-node/lib/qr-code-styling.common');
const canvas = require('canvas');

class qrGenerator {
    constructor({ imagePath }) {
        this.imagePath = imagePath;
    }

    generate = async function (data) {
        this.options = createOptions(data, this.imagePath);
        this.qrCodeImage = createQRCodeStyling(canvas, this.options);
        return await getRawData(this.qrCodeImage);
    }
}

function createOptions(data, image) {
    const mainBlue = "#0000FF";  // Azul principal

    return {
        width: 1000,
        height: 1000,
        data,
        image,
        margin: 20,
        dotsOptions: {
            type: "rounded",
            color: mainBlue
        },
        backgroundOptions: {
            color: "#FFFFFF",  // Fundo branco para contraste
        },
        imageOptions: {
            crossOrigin: "anonymous",
            imageSize: 0.4,
            margin: 10
        },
        cornersDotOptions: {
            type: 'dot',
            color: mainBlue
        },
        cornersSquareOptions: {
            type: 'extra-rounded',
            color: mainBlue
        }
    };
}

function createQRCodeStyling(nodeCanvas, options) {
    return new QRCodeStyling({
        nodeCanvas,
        ...options
    });
}

async function getRawData(qrCodeImage) {
    return qrCodeImage.getRawData("png").then(r => {
        return {
            status: 'success',
            response: r.toString('base64')
        }
    }).catch(e => {
        return {
            status: 'error',
            response: e
        }
    });
}

module.exports.qrGenerator = qrGenerator;