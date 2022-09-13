import { analyseBootstrap } from 'src/analyse'
import { bootstrap } from 'src/serve'
// thetaData ={}
// export default function () {
//   return {
//     analyse: analyseBootstrap,
//     server: bootstrap
//   }
// }
export const analyse = analyseBootstrap
export const serve = bootstrap
