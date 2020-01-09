const {PDFDocument} = require('pdf-lib');
const fs = require('fs');
const fse = require('fs-extra');
const baseUrl = process.cwd();
const imgExtension = ".jpg";
const pdfExtension = ".pdf";
const imgFolderName = '/vklaim-img/';
const pdfFolderName = '/scanned-pdf/';
const resultFolderName = '/result-pdf/';
//check who's left scanned pdf
Array.prototype.diff = function (arr2) {
    return this.filter(x => !arr2.includes(x));
};

function getExceptionPdf() {
    const data = fs.readFileSync(`${baseUrl}/exception.txt`);
    const exception = data.toString().split(',');
    return exception.map(item => {
        return parseInt(item);
    })
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

function getNameOnly(stringName, type) {
    if (type === 'pdf') {
        return stringName.replace(".pdf", "");
    } else if (type === 'jpg') {
        return stringName.replace(".jpg", "");
    }
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

async function editPDF({filePDF, fileIMG}) {
    const selectedPDF = await PDFDocument.load(getPDFinUin8Array(`${baseUrl}${pdfFolderName}${filePDF}${pdfExtension}`));
    const page = selectedPDF.addPage();
    const imageToEmbed = await selectedPDF.embedJpg(getPDFinUin8Array(`${baseUrl}${imgFolderName}${fileIMG}${imgExtension}`));
    //config for image
    const imageDims = imageToEmbed.scale(0.25);
    const options = {
        x: page.getWidth() / 2 - imageDims.width / 2,
        y: page.getHeight() / 2 - imageDims.height / 2,
        width: imageDims.width,
        height: imageDims.height,
    };
    page.drawImage(imageToEmbed, options);
    const pdfBytes = await selectedPDF.save();
    fs.writeFile(baseUrl + resultFolderName + `${filePDF}_Edited.pdf`, pdfBytes, function () {
        console.log(`${filePDF}_Edited.pdf Created`);
    })
}

async function initApp() {
    fse.emptyDirSync(baseUrl + resultFolderName);
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
        //sorting array
        const sortedArrayPdf = initPdf.sort(sortAsc);
        let sortedArrayImg = initImg.sort(sortAsc);
        fs.writeFileSync(baseUrl + '/imgExist.log', JSON.stringify(sortedArrayImg));

        // for (let i = 0; i < arrNumberImg; i++) {
        exceptionPdf.forEach(item => {
            const exceptionIndex = sortedArrayImg.findIndex(x=>x.number === item);
            console.log(exceptionIndex)
            if(exceptionIndex !== -1){
                sortedArrayImg.splice(exceptionIndex, 1);
            }
        });
        const sortedImg = sortedArrayImg.sort(sortAsc);
        fs.writeFileSync(baseUrl + '/pdfExist.log', JSON.stringify(sortedImg));
        console.log(sortedImg[exceptionPdf[0]])
        for (let i = 0; i < sortedImg.length; i++) {
            const fileIMG = getNameOnly(sortedImg[i].name, 'jpg');
            const filePDF = getNameOnly(sortedArrayPdf[i].name, 'pdf');
            await editPDF({filePDF, fileIMG});
        }
    } else {
        console.log(`Data yang dimasukkan masih kurang sesuai, cek pada exception.txt. Nomor yang belum ${differentData}, masih kurang ${initImg.length - initPdf.length} data lagi`);

    }



}

initApp();