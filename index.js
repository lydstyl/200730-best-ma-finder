const csv = require('csv-parser')
const fs = require('fs')

//let data = null

const getCsvData = async () => {
  const data = await (() => {
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

  return data
}

const findBestMa = async () => {
  let data = await getCsvData()

  data = removeTitle(data)

  data = addDate(data)

  console.log('findBestMa -> data', data[0])
}

const removeTitle = (data) => {
  const titles = data.shift()

  return data.map((d) => {
    const newData = {}
    for (let i = 0; i <= 7; i++) {
      newData[titles[i]] = d[i]
    }

    return newData
  })
}

const addDate = (data) => {
  return data.map((d) => ({ ...d, jsDate: new Date(d.Date) }))
}

findBestMa()
