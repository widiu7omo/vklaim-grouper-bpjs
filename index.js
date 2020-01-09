const {PDFDocument} = require('pdf-lib');
const fs = require('fs');
const baseUrl = process.cwd();
const imgExtension = ".jpg";
const pdfExtension = ".pdf";
const imgFolderName = '/vklaim-img';
const pdfFolderName = '/scanned-pdf';
const resultFolderName = '/result-pdf';

function getExceptionPdf() {
    const data = fs.readFileSync(`${baseUrl}/exception.txt`);
    return data.toString().split(',');
}

function sortAsc(a, b) {
    return a - b;
}

//check who's left scanned pdf
Array.prototype.diff = function (arr2) {
    return this.filter(x => !arr2.includes(x));
}

function initScannedFiles() {
    return new Promise(function (resolve, reject) {
        fs.readdir(baseUrl + pdfFolderName, function (err, data) {
            if (err) {
                reject(err);
            } else {
                const noPdf = data.map(function (item) {
                    const arrayItem = item.toString().split('.');
                    if (arrayItem.length > 0) {
                        return parseInt(arrayItem[0]);
                    }
                })
                resolve(noPdf);
            }
        })
    })
}

function initImgFiles() {
    return new Promise(function (resolve, reject) {
        fs.readdir(`${baseUrl}/vklaim-img`, function (err, data) {
            if (err) {
                reject(err)
            } else {
                const dataImg = data.map(function (item) {
                    return parseInt(item.replace(imgExtension, ""));
                });
                resolve(dataImg)
            }
        })
    })

}

function getPDFinUin8Array(filePath) {
    return fs.readFileSync(filePath);
}


async function editPDF(file) {
    const filePDF = await PDFDocument.load(getPDFinUin8Array(baseUrl + "/" + file + pdfExtension));
    const page = filePDF.addPage();
    const imageToEmbed = await filePDF.embedJpg(getPDFinUin8Array(baseUrl + imgFolderName + `/0001.jpg`));
    //config for image
    const imageDims = imageToEmbed.scale(0.25);
    const options = {
        x: page.getWidth() / 2 - imageDims.width / 2,
        y: page.getHeight() / 2 - imageDims.height / 2 ,
        width: imageDims.width,
        height: imageDims.height,
    };

    page.drawImage(imageToEmbed, options);
    const pdfBytes = await filePDF.save();
    fs.writeFile(baseUrl + resultFolderName + `/${file}_Edited.pdf`, pdfBytes, function () {
        console.log(`${file}_Edited.pdf Created`);
    })
}

async function initApp() {
    const exceptionPdf = await getExceptionPdf();
    const initImg = await initImgFiles();
    const initPdf = await initScannedFiles();
    console.log(initImg.sort(sortAsc));
    console.log(initPdf.sort(sortAsc));
    //get differences
    const differences = initImg.sort(sortAsc).diff(initPdf.sort(sortAsc));
    console.log(`Data yang dimasukkan masih kurang sesuai, nomor yang belum ${differences}, masih kurang ${initImg.length - initPdf.length} data lagi`);
    //write log pdf
    fs.writeFileSync(baseUrl + '/pdfExist.log', initPdf.sort(function (a, b) {
        return a - b;
    }).join("\n"));
    fs.writeFileSync(baseUrl + '/imgExist.log', initImg.join("\n"));
    editPDF("1. MSALMAN");
}

initApp();