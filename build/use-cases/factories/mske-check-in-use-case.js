"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/use-cases/factories/mske-check-in-use-case.ts
var mske_check_in_use_case_exports = {};
__export(mske_check_in_use_case_exports, {
  makeCheckInUseCase: () => makeCheckInUseCase
});
module.exports = __toCommonJS(mske_check_in_use_case_exports);

// src/env/index.ts
var import_config = require("dotenv/config");
var import_zod = require("zod");
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["dev", "test", "production"]).default("dev"),
  JWT_SECRET: import_zod.z.string(),
  PORT: import_zod.z.coerce.number().default(3333)
});
var _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  console.error("\u274C Invalid environment variables", _env.error.format());
  throw new Error("Invalid environment variables.");
}
var env = _env.data;

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient({
  log: env.NODE_ENV === "dev" ? ["query"] : []
});

// src/repositories/prisma/prisma-check-ins-repository.ts
var import_dayjs = __toESM(require("dayjs"));
var PrismaCheckInsRepository = class {
  async findById(id) {
    const checkIn = await prisma.checkIn.findUnique({
      where: {
        id
      }
    });
    return checkIn;
  }
  async findByUserIdOnDate(userId, date) {
    const startOfTheDay = (0, import_dayjs.default)(date).startOf("date");
    const endOfTheDay = (0, import_dayjs.default)(date).endOf("date");
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        user_id: userId,
        created_at: {
          gte: startOfTheDay.toDate(),
          lte: endOfTheDay.toDate()
        }
      }
    });
    return checkIn;
  }
  async findManyByUserId(userId, page) {
    const checkIns = await prisma.checkIn.findMany({
      where: {
        user_id: userId
      },
      skip: (page - 1) * 20,
      take: 20
    });
    return checkIns;
  }
  async countByUserId(userId) {
    const count = await prisma.checkIn.count({
      where: {
        user_id: userId
      }
    });
    return count;
  }
  async create(data) {
    const checkIn = await prisma.checkIn.create({
      data
    });
    return checkIn;
  }
  async save(data) {
    const checkIn = await prisma.checkIn.update({
      where: {
        id: data.id
      },
      data
    });
    return checkIn;
  }
};

// src/repositories/prisma/prisma-gyms-repository.ts
var PrismaGymsRepository = class {
  async findById(id) {
    const gym = await prisma.gym.findUnique({
      where: { id }
    });
    return gym;
  }
  async findManyNearby({ latitude, longitude }) {
    const gyms = await prisma.$queryRaw`
      SELECT * from gyms
      WHERE ( 6371 * acos( cos( radians(${latitude}) ) * cos( radians( latitude ) ) * 
        cos( radians( longitude ) - radians(${longitude}) ) + sin( radians(${latitude}) ) * 
        sin( radians( latitude ) ) ) ) <= 10
    `;
    return gyms;
  }
  async searchMany(query, page) {
    const gyms = await prisma.gym.findMany({
      where: { title: { contains: query } },
      take: 20,
      skip: (page - 1) * 20
    });
    return gyms;
  }
  async create(data) {
    const gym = await prisma.gym.create({ data });
    return gym;
  }
};

// src/use-cases/errors/resource-not-found-error.ts
var ResourceNotFoundError = class extends Error {
  constructor() {
    super("Resource not found.");
  }
};

// src/utils/get-distance-beetwen-coordinates.ts
function getDistanceBetweenCoordinates(from, to) {
  if (from.latitude === to.latitude && from.longitude === to.longitude) {
    return 0;
  }
  const fromRadian = Math.PI * from.latitude / 180;
  const toRadian = Math.PI * to.latitude / 180;
  const theta = from.longitude - to.longitude;
  const radTheta = Math.PI * theta / 180;
  let dist = Math.sin(fromRadian) * Math.sin(toRadian) + Math.cos(fromRadian) * Math.cos(toRadian) * Math.cos(radTheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = dist * 180 / Math.PI;
  dist = dist * 60 * 1.1515;
  dist = dist * 1.609344;
  return dist;
}

// src/use-cases/errors/max-distance-error.ts
var MaxDistanceError = class extends Error {
  constructor() {
    super("Max distance reached.");
  }
};

// src/use-cases/errors/max-number-of-check-ins-error.ts
var MaxNumberOfCheckInsError = class extends Error {
  constructor() {
    super("Max number of check-ins reached.");
  }
};

// src/use-cases/check-in.ts
var CheckInUseCase = class {
  constructor(checkInsRepository, gymsRepository) {
    this.checkInsRepository = checkInsRepository;
    this.gymsRepository = gymsRepository;
  }
  async execute({
    userId,
    gymId,
    userLatitude,
    userLongitude
  }) {
    const gym = await this.gymsRepository.findById(gymId);
    if (!gym) {
      throw new ResourceNotFoundError();
    }
    const distance = getDistanceBetweenCoordinates(
      { latitude: userLatitude, longitude: userLongitude },
      { latitude: gym.latitude.toNumber(), longitude: gym.longitude.toNumber() }
    );
    const MAX_DISTANCE_IN_KILOMETERS = 0.1;
    if (distance > MAX_DISTANCE_IN_KILOMETERS) {
      throw new MaxDistanceError();
    }
    const checkInOnSameDay = await this.checkInsRepository.findByUserIdOnDate(userId, /* @__PURE__ */ new Date());
    if (checkInOnSameDay) {
      throw new MaxNumberOfCheckInsError();
    }
    const checkIn = await this.checkInsRepository.create({ gym_id: gymId, user_id: userId });
    return { checkIn };
  }
};

// src/use-cases/factories/mske-check-in-use-case.ts
function makeCheckInUseCase() {
  const checkInsRepository = new PrismaCheckInsRepository();
  const gymsRepository = new PrismaGymsRepository();
  const useCase = new CheckInUseCase(checkInsRepository, gymsRepository);
  return useCase;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  makeCheckInUseCase
});
