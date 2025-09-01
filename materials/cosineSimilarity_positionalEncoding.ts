const func = () => {
  // const A = [1,2,3,4]
  // const B = [2,3,4,5]
  const A = [0.3434, 0.1234]
  const B = [-0.62, -0.24]

  // Option 1 - Normalisation
  const magnitudeA = Math.sqrt(A.reduce((acc, i) => acc + Math.pow(i, 2) , 0))
  const magnitudeB = Math.sqrt(B.reduce((acc, i) => acc + Math.pow(i, 2) , 0))

  const normalisedA = A.map(i => i / magnitudeA)
  const normalisedB = B.map(i => i / magnitudeB)

  // Option 2 - 
  const dotProductsOfNormalisedVectors = normalisedA.map((itm, idx) => itm * normalisedB[idx])

  const cosineSimilarity = dotProductsOfNormalisedVectors.reduce((acc, i) => acc + i, 0)

  console.log({ magnitudeA, dotProductsOfNormalisedVectors })
  console.log({ normalisedA, normalisedB })
  console.log({ cosineSimilarity })


  // PE
  const tokenA_Vectors = A // Hello
  const tokenB_Vectors = B // GPT

  const dimension = A.length

  const peA = tokenA_Vectors.map((a, i) => {
    const isOdd = i % 2 !== 0

    const pow = i / dimension

    const pos = 0 // since first word

    const pe = (isOdd ? Math.cos : Math.sin)(pos / Math.pow(10_000, pow))

    return pe
  })

  const peB = tokenB_Vectors.map((b, i) => {
    const isOdd = i % 2 !== 0

    const pow = i / dimension

    const pos = 1 // since second word

    const pe = (isOdd ? Math.cos : Math.sin)(pos / Math.pow(10_000, pow))

    return pe
  })

  console.log({ peA, peB })

  const finalPositionalEncoding_A = A.map((a, i) => {
    return a + peA[i]
  })

  const finalPositionalEncoding_B = B.map((b, i) => {
    return b + peB[i]
  })

  console.log({ finalPositionalEncoding_A, finalPositionalEncoding_B })
}