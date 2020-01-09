const {PDFDocument} = require('pdf-lib');
const fs = require('fs');
const baseUrl = process.cwd();
const imgExtension = ".jpg";
const pdfExtension = ".pdf";
const imgFolderName = '/vklaim-img';
const pdfFolderName = '/scanned-pdf';
const resultFolderName = '/result-pdf';
//check who's left scanned pdf
Array.prototype.diff = function (arr2) {
    return this.filter(x => !arr2.includes(x));
}

function getExceptionPdf() {
    const data = fs.readFileSync(`${baseUrl}/exception.txt`);
    return data.toString().split(',');
}

function sortAsc(a, b) {
    if (typeof a === "number" && typeof b === "number") {
        return a - b;
    }
    return a.number - b.number;
}

function getDifferences(arrNumberImg, arrNumberPdf) {
    return arrNumberImg.sort(sortAsc).diff(arrNumberPdf.sort(sortAsc));
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
                        return {"number": parseInt(arrayItem[0]), "name": item};
                    }
                });
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
                    return {"number": parseInt(item.replace(imgExtension, "")), "name": item};
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
        y: page.getHeight() / 2 - imageDims.height / 2,
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
    //initialize exception pdf
    //add exception to array pdf to reach same array
    //compare img and pdf (ref:img)
    // dialog, alert when miss, and exit if there are not same
    //looping
    //check is exception exit?
    //true then looping with exception change
    console.log(initImg.sort(sortAsc));
    console.log(initPdf.sort(sortAsc));
    //get differences
    const arrNumberImg = initImg.map(item => item.number);
    const arrNumberPdf = initPdf.map(item => item.number);
    const differences = getDifferences(arrNumberImg, arrNumberPdf);
    console.log(`Perbedaan tanpa cek pengecualian ${differences}, masih kurang ${initImg.length - initPdf.length} data lagi`);
    //write log pdf

    const mergedNumberPdfAndException = [...arrNumberPdf, ...exceptionPdf];
    const isDifferent = getDifferences(arrNumberImg, mergedNumberPdfAndException).length !== 0;
    const differentData = getDifferences(arrNumberImg, mergedNumberPdfAndException);
    if (!isDifferent) {
        //process to pdf
        for (let i = 0; i < arrNumberImg; i++) {

        }
    } else {
        console.log(`Data yang dimasukkan masih kurang sesuai, cek pada exception.txt. Nomor yang belum ${differentData}, masih kurang ${initImg.length - initPdf.length} data lagi`);

    }


    fs.writeFileSync(baseUrl + '/pdfExist.log', initPdf.sort(function (a, b) {
        return a - b;
    }).join("\n"));
    fs.writeFileSync(baseUrl + '/imgExist.log', initImg.join("\n"));
    editPDF("1. MSALMAN");
}

initApp();