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
exports.StakeEntity = exports.Stake = exports.STAKE_NODE_TYPE_ENUM = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const graphql_2 = require("graphql");
var STAKE_NODE_TYPE_ENUM;
(function (STAKE_NODE_TYPE_ENUM) {
    STAKE_NODE_TYPE_ENUM[STAKE_NODE_TYPE_ENUM["validator"] = 0] = "validator";
    STAKE_NODE_TYPE_ENUM[STAKE_NODE_TYPE_ENUM["guardian"] = 1] = "guardian";
    STAKE_NODE_TYPE_ENUM[STAKE_NODE_TYPE_ENUM["edge_cache"] = 2] = "edge_cache";
})(STAKE_NODE_TYPE_ENUM = exports.STAKE_NODE_TYPE_ENUM || (exports.STAKE_NODE_TYPE_ENUM = {}));
(0, graphql_1.registerEnumType)(STAKE_NODE_TYPE_ENUM, { name: 'STAKE_NODE_TYPE_ENUM' });
let Stake = class Stake {
};
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Stake.prototype, "source", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Stake.prototype, "amount", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_2.GraphQLBoolean),
    __metadata("design:type", Boolean)
], Stake.prototype, "withdrawn", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Stake.prototype, "return_height", void 0);
Stake = __decorate([
    (0, graphql_1.ObjectType)()
], Stake);
exports.Stake = Stake;
let StakeEntity = class StakeEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StakeEntity.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => STAKE_NODE_TYPE_ENUM),
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], StakeEntity.prototype, "node_type", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StakeEntity.prototype, "holder", void 0);
__decorate([
    (0, graphql_1.Field)(() => [Stake]),
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", Array)
], StakeEntity.prototype, "stakes", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({
        type: 'int'
    }),
    __metadata("design:type", Number)
], StakeEntity.prototype, "last_signature", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], StakeEntity.prototype, "update_height", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Number)
], StakeEntity.prototype, "create_date", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Number)
], StakeEntity.prototype, "update_date", void 0);
StakeEntity = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)(['node_type']),
    (0, graphql_1.ObjectType)()
], StakeEntity);
exports.StakeEntity = StakeEntity;
//# sourceMappingURL=stake.entity.js.map