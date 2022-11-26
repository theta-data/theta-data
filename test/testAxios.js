// run `node index.js` in the terminal

console.log(`Hello Node.js v${process.versions.node}!`)

const axios = require('axios')

const url =
  'https://api.thetadrop.com/pack/pack_d7h6zjr8180fdkymr4kn0nj1zr5.json?nft_id=nft_gqghctwjchy0cihskqy0c3wjvna3'

async function main() {
  const res = await axios({
    method: 'get',
    url,
    timeout: 10000,
    responseType: 'json',
    responseEncoding: 'utf8',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br'
    }
  })
  console.log(res)
}
main()
