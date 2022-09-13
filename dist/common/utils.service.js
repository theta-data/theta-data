"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFailExcuteLog = exports.writeSucessExcuteLog = exports.UtilsService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const theta_ts_sdk_1 = require("theta-ts-sdk");
const config = require('config');
const fs = require('fs');
const stream = require('stream');
const url = require('url');
const { promisify } = require('util');
const got = require('got');
const path = require('path');
const moment = require('moment');
let UtilsService = class UtilsService {
    constructor() {
        this.logger = new common_1.Logger();
        this.normalize = function (hash) {
            const regex = /^0x/i;
            return regex.test(hash) ? hash : '0x' + hash;
        };
    }
    decodeLogs(logs, abi) {
        const iface = new ethers_1.ethers.utils.Interface(abi || []);
        return logs.map((log) => {
            try {
                let event = null;
                for (let i = 0; i < abi.length; i++) {
                    let item = abi[i];
                    if (item.type != 'event')
                        continue;
                    const hash = iface.getEventTopic(item.name);
                    if (hash == log.topics[0]) {
                        event = item;
                        break;
                    }
                }
                if (event != null) {
                    let bigNumberData = iface.decodeEventLog(event.name, log.data, log.topics);
                    let data = {};
                    Object.keys(bigNumberData).forEach((k) => {
                        data[k] = bigNumberData[k].toString();
                    });
                    log.decode = {
                        result: data,
                        eventName: event.name,
                        event: event
                    };
                }
                else {
                    log.decode = 'No matched event or the smart contract source code has not been verified.';
                }
                return log;
            }
            catch (e) {
                throw new Error('Something wrong while decoding, met error: ' + e);
            }
        });
    }
    checkTnt721(abi) {
        const obj = {
            balanceOf: { contains: false, type: 'function' },
            ownerOf: { contains: false, type: 'function' },
            safeTransferFrom: { contains: false, type: 'function' },
            transferFrom: { contains: false, type: 'function' },
            approve: { contains: false, type: 'function' },
            setApprovalForAll: { contains: false, type: 'function' },
            getApproved: { contains: false, type: 'function' },
            isApprovedForAll: { contains: false, type: 'function' },
            Transfer: { contains: false, type: 'event' },
            Approval: { contains: false, type: 'event' },
            ApprovalForAll: { contains: false, type: 'event' }
        };
        return this.check(obj, abi);
    }
    checkTnt20(abi) {
        const obj = {
            name: { contains: false, type: 'function' },
            symbol: { contains: false, type: 'function' },
            decimals: { contains: false, type: 'function' },
            totalSupply: { contains: false, type: 'function' },
            balanceOf: { contains: false, type: 'function' },
            transfer: { contains: false, type: 'function' },
            transferFrom: { contains: false, type: 'function' },
            approve: { contains: false, type: 'function' },
            allowance: { contains: false, type: 'function' },
            Transfer: { contains: false, type: 'event' },
            Approval: { contains: false, type: 'event' }
        };
        return this.check(obj, abi);
    }
    check(obj, abi) {
        abi.forEach((o) => {
            if (obj[o.name] !== undefined) {
                if (obj[o.name].type === o.type) {
                    obj[o.name].contains = true;
                }
            }
        });
        let res = true;
        for (let key in obj) {
            res = res && obj[key].contains;
        }
        return res;
    }
    async readSmartContract(from, to, abi, functionName, inputTypes, inputValues, outputTypes) {
        const iface = new ethers_1.ethers.utils.Interface(abi || []);
        const functionSignature = iface.getSighash(functionName);
        var abiCoder = new ethers_1.ethers.utils.AbiCoder();
        var encodedParameters = abiCoder.encode(inputTypes, inputValues).slice(2);
        const data = functionSignature + encodedParameters;
        this.logger.debug('from:' + from + '; to:' + to + '; data:' + data);
        const res = await theta_ts_sdk_1.thetaTsSdk.blockchain.callSmartContract(from, to, data);
        this.logger.debug('read smart contract: ' + JSON.stringify(res));
        const outputValues = /^0x/i.test(res.result.vm_return)
            ? res.result.vm_return
            : '0x' + res.result.vm_return;
        const decodeValues = abiCoder.decode(outputTypes, outputValues);
        this.logger.debug('decode: ' + JSON.stringify(decodeValues));
        return decodeValues;
    }
    getHex(str) {
        const buffer = Buffer.from(str, 'base64');
        const bufString = buffer.toString('hex');
        return '0x' + bufString;
    }
    getBytecodeWithoutMetadata(bytecode) {
        const metadataSize = parseInt(bytecode.slice(-4), 16) * 2 + 4;
        const metadataStarts = bytecode.slice(bytecode.length - metadataSize, bytecode.length - metadataSize + 14);
        const endPoint = bytecode.indexOf(metadataStarts);
        return bytecode.slice(0, endPoint);
    }
    stampDate(sourceCode) {
        let date = new Date();
        const offset = date.getTimezoneOffset();
        date = new Date(date.getTime() - offset * 60 * 1000);
        return (`/**\n *Submitted for verification at thetadata.io on ${date.toISOString().split('T')[0]}\n */\n` + sourceCode);
    }
    getRecordHeight(path) {
        const fs = require('fs');
        if (!fs.existsSync(path)) {
            this.logger.debug('read height');
            this.logger.debug('finish mkdir');
            fs.writeFileSync(path, '0');
            return 0;
        }
        else {
            const data = fs.readFileSync(path, 'utf8');
            return Number(data) + 1;
        }
    }
    updateRecordHeight(path, height) {
        const fs = require('fs');
        fs.writeFileSync(path, height.toString());
    }
    getRandomStr(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    async downloadImage(urlPath, storePath) {
        this.logger.debug('url path: ' + urlPath);
        if (!urlPath)
            return null;
        const pipeline = promisify(stream.pipeline);
        var parsed = url.parse(urlPath);
        if (!parsed.hostname) {
            return urlPath.replace(storePath, '');
        }
        if (!parsed.pathname.includes('gif') &&
            !parsed.pathname.includes('png') &&
            !parsed.pathname.includes('jpg') &&
            !parsed.pathname.includes('jpeg') &&
            !parsed.pathname.includes('svg')) {
            return null;
        }
        const imgPath = storePath + '/' + parsed.hostname.replace(/\./g, '-');
        const imgStorePath = imgPath + parsed.pathname;
        const pathArr = imgStorePath.split('/');
        pathArr.pop();
        if (!fs.existsSync(pathArr.join('/'))) {
            fs.mkdirSync(pathArr.join('/'), { recursive: true });
        }
        console.log(path.basename(parsed.pathname));
        if (!fs.existsSync(imgStorePath)) {
            try {
                await pipeline(got.stream(urlPath), fs.createWriteStream(imgStorePath));
                return imgStorePath.replace(storePath, '');
            }
            catch (e) {
                console.error(e);
                return null;
            }
        }
        else {
            return imgStorePath.replace(storePath, '');
        }
    }
    async getPath(urlPath, storePath) {
        this.logger.debug('url path: ' + urlPath);
        if (!urlPath)
            return null;
        var parsed = url.parse(urlPath);
        if (!parsed.hostname) {
            return urlPath.replace(storePath, '');
        }
        if (!parsed.pathname.includes('gif') &&
            !parsed.pathname.includes('png') &&
            !parsed.pathname.includes('jpg') &&
            !parsed.pathname.includes('jpeg') &&
            !parsed.pathname.includes('svg')) {
            return null;
        }
        const imgPath = storePath + '/' + parsed.hostname.replace(/\./g, '-');
        return imgPath + parsed.pathname;
    }
    async timeout(timeout) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve('timeout');
                this.logger.debug('timeout');
            }, timeout);
        });
    }
};
UtilsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UtilsService);
exports.UtilsService = UtilsService;
function writeSucessExcuteLog(logPath) {
    const fs = require('fs');
    if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
    }
    fs.writeFileSync(logPath + '/log.txt', moment().format() + ' success');
}
exports.writeSucessExcuteLog = writeSucessExcuteLog;
function writeFailExcuteLog(logPath) {
    const fs = require('fs');
    if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
    }
    fs.writeFileSync(logPath + '/log.txt', moment().format() + ' fail');
}
exports.writeFailExcuteLog = writeFailExcuteLog;
//# sourceMappingURL=utils.service.js.map