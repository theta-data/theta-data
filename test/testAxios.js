const axios = require('axios')
async function getRes() {
  const res = await axios({
    url: 'https://user-assets-thetadrop.imgix.net/user_jpihbkpjm7a4q7ua6pa7jb98gav/Packs/S2R1/s1r2_starter4.png',
    method: 'get',
    timeout: 10000,
    responseType: 'json'
  })
  console.log(res)
}
getRes()
