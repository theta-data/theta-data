// run `node index.js` in the terminal

console.log(`Hello Node.js v${process.versions.node}!`)

const axios = require('axios')

// const url =
//   'https://api.thetadrop.com/type/type_q6kexwknrap7xzdhk8x2t9b5447.json?nft_id=nft_iiepzyvy3i5803ywnb59h8cuu0pv'

async function main() {
  const option = {
    url: 'https://api.thetadrop.com/type/type_f3s3nre856scgsbcbsphnfu2guy.json?nft_id=nft_urfuk33h7ygrjb7tp7s5qecyz89z',
    timeout: 3000,
    method: 'get'
    // responseType: 'json'
    // responseEncoding: 'utf8',
  }

  const res = await axios(option)
  console.log(res)
  console.log(res.data)
}
main()
