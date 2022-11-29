const url = require('url')
const urlPath = 'https://www.google.com'
// var parsed = url.parse(urlPath)
var parsed = url.parse(urlPath)
if (!parsed.pathname.replace(/\//g, '')) {
  console.log(1)
  console.log(parsed.pathname)
} else {
  console.log(2)
}
if (null) {
  console.log(3)
}
