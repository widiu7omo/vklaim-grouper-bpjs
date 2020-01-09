const {PDFDocument} = require('pdf-lib');
const fs = require('fs');
const baseUrl = process.cwd();
const imgExtension = ".jpg";
const imgFolderName = '/vklaim-img';
const pdfFolderName = '/scanned-pdf';

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


async function createPDF() {
    const exception = await getExceptionPdf();
    const initImg = await initImgFiles();
    const initPdf = await initScannedFiles();
    console.log(initImg.sort(sortAsc));
    console.log(initPdf.sort(sortAsc));
    //get differences
    const differences = initImg.sort(sortAsc).diff(initPdf.sort(sortAsc));
    console.log(differences);
    console.log(initImg.length - initPdf.length);
    //write log pdf
    fs.writeFileSync(baseUrl + '/pdfExist.log', initPdf.sort(function (a, b) {
        return a - b;
    }).join("\n"));
    fs.writeFileSync(baseUrl + '/imgExist.log', initImg.join("\n"));
    const filePDF = await PDFDocument.create();
    const page = filePDF.addPage();
    page.drawText("Testing Development");
    const pdfBytes = await filePDF.save();
    fs.writeFile(`${baseUrl}/pdf.pdf`, pdfBytes, function () {
        console.log('writein')
    })
}

createPDF();