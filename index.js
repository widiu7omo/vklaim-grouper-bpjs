const {PDFDocument} = require('pdf-lib');
const fs = require('fs');
const baseUrl = process.cwd();
const imgExtension = ".jpg";
const imgFolderName = 'vklaim-img';
const pdfFolderName = 'scanned-pdf';

function getExceptionPdf() {
    const data = fs.readFileSync(`${baseUrl}/exception.txt`);
    return data.toString().split(',');
}

function initScannedFiles() {
    return new Promise(function (resolve,reject) {
        fs.readdir(baseUrl+pdfFolderName,function (err,data) {
            if(err){
                reject(err)
            }
            else{
                data.map(function(item){

                })
            }
        })
    })
}

function initImgFiles() {
    return new Promise(function (resolve, reject) {
        fs.readdir(`${baseUrl}/vklaim-img`, function (err, data) {
            if(err){
                reject(err)
            }
            else{
                const dataImg = data.map(function (item) {
                    return item.replace(imgExtension, "");
                });
                resolve(dataImg)
            }
        })
    })

}

async function createPDF() {
    const exception = await getExceptionPdf();
    const initImg = await initImgFiles();
    console.log(initImg);
    const filePDF = await PDFDocument.create();
    const page = filePDF.addPage();
    page.drawText("Testing Development");
    const pdfBytes = await filePDF.save();
    fs.writeFile(`${baseUrl}/pdf.pdf`, pdfBytes, function () {
        console.log('writein')
    })
}

createPDF();