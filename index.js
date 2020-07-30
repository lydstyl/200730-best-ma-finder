const csv = require('csv-parser')
const fs = require('fs')

let data = null

const getCsvData = async () => {
  data = await (() => {
    return new Promise((resolve, rejet) => {
      const results = []

      try {
        fs.createReadStream('data.csv')
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            resolve(results)
          })
      } catch (error) {
        reject(error)
      }
    })
  })()
}

const findBestMa = async () => {
  await getCsvData()

  removeTitlesAndChangeDataKeys()

  addJsDateToData()

  console.log('findBestMa -> data', data[0])
}

const removeTitlesAndChangeDataKeys = () => {
  const titles = data.shift()

  return data.map((d) => {
    const newData = {}
    for (let i = 0; i <= 7; i++) {
      newData[titles[i]] = d[i]
    }

    return newData
  })
}

const addJsDateToData = () => {
  return data.map((d) => ({ ...d, jsDate: new Date(d.Date) }))
}

findBestMa()
