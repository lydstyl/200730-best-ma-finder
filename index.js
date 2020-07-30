const csv = require('csv-parser')
const fs = require('fs')

const nbOfLine = 970
let biggestMa = 50

const settings = {
  nbOfLine,
  maLen: biggestMa,
  numberOfLinesToUse: nbOfLine + biggestMa, // x days + ma200 is the biggest ma
  comission: 0.0025,
}

global.data = null

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

  return data.map((d) => {
    return d
  })
}

const findBestMa = async () => {
  let data = await getCsvData()

  global.data = removeTitlesAndChangeDataKeys(data)

  //addJsDateToData()

  sliceData(settings.numberOfLinesToUse)

  addMAverages()

  data = addAmounts()
  console.log(
    'findBestMa -> data',
    Array.isArray(data),
    data.length,
    data[data.length - 1]
  )

  // console.log('findBestMa -> global.data', global.data[0])
}

const removeTitlesAndChangeDataKeys = (data) => {
  const titles = data.shift()

  return data.map((d) => {
    const newData = {}
    for (let i = 0; i <= 7; i++) {
      if (
        titles[i] === 'Open' ||
        titles[i] === 'High' ||
        titles[i] === 'Low' ||
        titles[i] === 'Volume BTC' ||
        titles[i] === 'Volume USD'
      ) {
        continue
      }

      newData[titles[i]] = d[i]

      if (titles[i] === 'Close') {
        newData[titles[i]] = parseFloat(d[i])
      }
    }

    return newData
  })
}

const addJsDateToData = () => {
  data = data.map((d) => ({ ...d, JsDate: new Date(d.Date) }))
}

const sliceData = (lineNb) => {
  data = data.slice(0, lineNb)
}

const addMAverages = () => {
  newLines = []

  for (let i = 0; i <= nbOfLine; i++) {
    const line = data[i]

    let ma2Data = data.slice(i, i + settings.maLen)

    ma2Data = ma2Data.map((m) => {
      return m.Close
    })

    line.ma2 =
      ma2Data.reduce((accumulator, currentValue) => {
        return parseFloat(accumulator) + parseFloat(currentValue)
      }) / settings.maLen

    if (line.Close > line.ma2) {
      line.isCloseAboveMa2 = true
    }

    newLines.push(line)
  }

  return newLines
}

const addAmounts = () => {
  // first  we don't have BTC

  let lines = data.slice(0, settings.nbOfLine).reverse()

  lines[0].totalUSD = 100
  lines[0].cryptoNb = 0
  lines[0].usdValue = 100
  lines[0].operation = 'sell'
  console.log('addAmounts -> lines[0]', lines[0])

  let previousLine = lines[0]

  lines.map((l, index) => {
    if (index) {
      previousLine = lines[index - 1]

      if (!l.totalUSD) {
        l.totalUSD = previousLine.totalUSD
      }

      if (!l.cryptoNb) {
        l.cryptoNb = previousLine.cryptoNb
      }
    }

    if (l.isCloseAboveMa2) {
      l.operation = 'buy'
    } else {
      l.operation = 'sell'
    }

    l.isPreviousOperationDifferente = l.operation !== previousLine.operation

    if (previousLine.Date === l.Date) {
      l.isPreviousOperationDifferente = true
    }

    if (l.isPreviousOperationDifferente) {
      if (l.operation === 'buy') {
        l.usdValue = l.totalUSD * (1 - settings.comission)

        l.cryptoNb = (l.totalUSD / l.Close) * (1 - settings.comission)

        l.totalUSD = 0
      } else if (l.operation === 'sell') {
        l.operation = 'sell'

        l.usdValue = l.cryptoNb * l.Close * (1 - settings.comission)

        l.cryptoNb = 0

        l.totalUSD = l.usdValue
      }
    } else {
      l.usdValue = previousLine.usdValue
    }

    return l
  })

  data = lines

  return lines
}

findBestMa()
