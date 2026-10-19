import { api, body, STAFF, ApiError, ensure } from "@/lib/phase4-server";
import {
  evaluateGeneralFitness,
  evaluateFootballFitness,
  evaluateBasketballFitness,
  calcRAST,
  calcRSSA,
  calcVerticalJump,
  type GeneralFitnessInputs,
  type FootballFitnessInputs,
  type BasketballFitnessInputs,
} from "@/lib/fitness-calculation";
import {
  GROUP9_TEST_KEYS,
  Group9ValidationError,
  evaluateGroup9Fitness,
  isGroup9Gender,
  toBodyWeightRatio,
  type Group9Inputs,
} from "@/lib/fitness-group9-norms";

/**
 * POST /api/staff/fitness-tests/evaluate
 * เครื่องมือช่วยคำนวณและประเมินผลสมรรถภาพแบบ Real-time (สำหรับ Front-End)
 */
export async function POST(request: Request) {
  return api(request, STAFF, async () => {
    const data = await body(request);
    const type = typeof data.type === "string" ? data.type.toLowerCase() : "general";

    if (type === "group9") {
      ensure(isGroup9Gender(data.gender), "กรุณาระบุเพศเป็น ชาย หรือ หญิง");
      const inputs: Group9Inputs = {};

      for (const key of GROUP9_TEST_KEYS) {
        const value = data[key];
        if (value !== undefined && value !== null && value !== "") {
          const numericValue = Number(value);
          ensure(Number.isFinite(numericValue), `ค่า ${key} ต้องเป็นตัวเลข`);
          inputs[key] = numericValue;
        }
      }

      const weightKg = data.weightKg === undefined ? undefined : Number(data.weightKg);

      try {
        if (inputs.gripStrengthRatio === undefined && data.gripStrengthKg !== undefined) {
          ensure(Number.isFinite(weightKg) && Number(weightKg) > 0, "ต้องระบุน้ำหนักตัวเพื่อคำนวณแรงบีบมือต่อน้ำหนักตัว");
          inputs.gripStrengthRatio = toBodyWeightRatio(Number(data.gripStrengthKg), Number(weightKg));
        }
        if (inputs.legStrengthRatio === undefined && data.legStrengthKg !== undefined) {
          ensure(Number.isFinite(weightKg) && Number(weightKg) > 0, "ต้องระบุน้ำหนักตัวเพื่อคำนวณแรงเหยียดขาต่อน้ำหนักตัว");
          inputs.legStrengthRatio = toBodyWeightRatio(Number(data.legStrengthKg), Number(weightKg));
        }
        const evaluation = evaluateGroup9Fitness(inputs, data.gender);
        return { type: "group9", evaluation };
      } catch (error) {
        if (error instanceof Group9ValidationError) throw new ApiError(400, error.message);
        throw error;
      }
    }

    if (type === "rast") {
      const weightKg = Number(data.weightKg);
      const timesSec = Array.isArray(data.timesSec) ? data.timesSec.map(Number) : [];
      const distanceM = data.distanceM ? Number(data.distanceM) : 35;
      const result = calcRAST(weightKg, timesSec, distanceM);
      return { type: "rast", result };
    }

    if (type === "rssa") {
      const runs = Array.isArray(data.runs) ? data.runs.map(Number) : [];
      const result = calcRSSA(runs);
      return { type: "rssa", result };
    }

    if (type === "vertical-jump" || type === "verticaljump") {
      const standingReachCm = Number(data.standingReachCm);
      const jumpReachCm = Number(data.jumpReachCm);
      const result = calcVerticalJump(standingReachCm, jumpReachCm);
      return { type: "vertical-jump", result };
    }

    if (type === "football" || type === "soccer" || type === "ฟุตบอล") {
      let rssaBest = data.rssaBestSec !== undefined ? Number(data.rssaBestSec) : undefined;
      let rssaMean = data.rssaMeanSec !== undefined ? Number(data.rssaMeanSec) : undefined;
      let rssaDec = data.rssaDecrementPercent !== undefined ? Number(data.rssaDecrementPercent) : undefined;

      if (Array.isArray(data.rssaRuns) && data.rssaRuns.length > 0) {
        const rssaCalc = calcRSSA(data.rssaRuns.map(Number));
        rssaBest = rssaBest ?? rssaCalc.rssaBest;
        rssaMean = rssaMean ?? rssaCalc.rssaMean;
        rssaDec = rssaDec ?? rssaCalc.decrementPercent;
      }

      let vertJump = data.verticalJumpCm !== undefined ? Number(data.verticalJumpCm) : undefined;
      if (vertJump === undefined && data.standingReachCm !== undefined && data.jumpReachCm !== undefined) {
        vertJump = calcVerticalJump(Number(data.standingReachCm), Number(data.jumpReachCm)).jumpHeightCm;
      }

      let rastMax = data.rastMaxPowerWatts !== undefined ? Number(data.rastMaxPowerWatts) : undefined;
      let rastMin = data.rastMinPowerWatts !== undefined ? Number(data.rastMinPowerWatts) : undefined;
      let rastAvg = data.rastAvgPowerWatts !== undefined ? Number(data.rastAvgPowerWatts) : undefined;
      let rastFatigue = data.rastFatigueIndex !== undefined ? Number(data.rastFatigueIndex) : undefined;

      if (data.weightKg && Array.isArray(data.rastTimesSec) && data.rastTimesSec.length > 0) {
        const rastCalc = calcRAST(Number(data.weightKg), data.rastTimesSec.map(Number), data.distanceM ? Number(data.distanceM) : 35);
        rastMax = rastMax ?? rastCalc.maxPower;
        rastMin = rastMin ?? rastCalc.minPower;
        rastAvg = rastAvg ?? rastCalc.avgPower;
        rastFatigue = rastFatigue ?? rastCalc.fatigueIndex;
      }

      const footballInputs: FootballFitnessInputs = {
        sprint10mSec: data.sprint10mSec !== undefined ? Number(data.sprint10mSec) : undefined,
        sprint20mSec: data.sprint20mSec !== undefined ? Number(data.sprint20mSec) : undefined,
        sprint40mSec: data.sprint40mSec !== undefined ? Number(data.sprint40mSec) : undefined,
        tTestSec: data.tTestSec !== undefined ? Number(data.tTestSec) : undefined,
        fafSlalomSec: data.fafSlalomSec !== undefined ? Number(data.fafSlalomSec) : undefined,
        semoTestSec: data.semoTestSec !== undefined ? Number(data.semoTestSec) : undefined,
        verticalJumpCm: vertJump,
        standingBroadJumpCm: data.standingBroadJumpCm !== undefined ? Number(data.standingBroadJumpCm) : undefined,
        rssaBestSec: rssaBest,
        rssaMeanSec: rssaMean,
        rssaDecrementPercent: rssaDec,
        rastMaxPowerWatts: rastMax,
        rastMinPowerWatts: rastMin,
        rastAvgPowerWatts: rastAvg,
        rastFatigueIndex: rastFatigue,
        vo2maxMlKgMin: data.vo2maxMlKgMin !== undefined ? Number(data.vo2maxMlKgMin) : undefined,
      };

      const evaluation = evaluateFootballFitness(footballInputs);
      return { type: "football", evaluation };
    }

    if (type === "basketball" || type === "บาสเกตบอล") {
      let rssaBest = data.rssaBestSec !== undefined ? Number(data.rssaBestSec) : undefined;
      let rssaMean = data.rssaMeanSec !== undefined ? Number(data.rssaMeanSec) : undefined;
      let rssaDec = data.rssaDecrementPercent !== undefined ? Number(data.rssaDecrementPercent) : undefined;

      if (Array.isArray(data.rssaRuns) && data.rssaRuns.length > 0) {
        const rssaCalc = calcRSSA(data.rssaRuns.map(Number));
        rssaBest = rssaBest ?? rssaCalc.rssaBest;
        rssaMean = rssaMean ?? rssaCalc.rssaMean;
        rssaDec = rssaDec ?? rssaCalc.decrementPercent;
      }

      let vertJump = data.verticalJumpCm !== undefined ? Number(data.verticalJumpCm) : undefined;
      if (vertJump === undefined && data.standingReachCm !== undefined && data.jumpReachCm !== undefined) {
        vertJump = calcVerticalJump(Number(data.standingReachCm), Number(data.jumpReachCm)).jumpHeightCm;
      }

      let rastMax = data.rastMaxPowerWatts !== undefined ? Number(data.rastMaxPowerWatts) : undefined;
      let rastMin = data.rastMinPowerWatts !== undefined ? Number(data.rastMinPowerWatts) : undefined;
      let rastAvg = data.rastAvgPowerWatts !== undefined ? Number(data.rastAvgPowerWatts) : undefined;
      let rastFatigue = data.rastFatigueIndex !== undefined ? Number(data.rastFatigueIndex) : undefined;

      if (data.weightKg && Array.isArray(data.rastTimesSec) && data.rastTimesSec.length > 0) {
        const rastCalc = calcRAST(Number(data.weightKg), data.rastTimesSec.map(Number), data.distanceM ? Number(data.distanceM) : 35);
        rastMax = rastMax ?? rastCalc.maxPower;
        rastMin = rastMin ?? rastCalc.minPower;
        rastAvg = rastAvg ?? rastCalc.avgPower;
        rastFatigue = rastFatigue ?? rastCalc.fatigueIndex;
      }

      const basketballInputs: BasketballFitnessInputs = {
        sprint10mSec: data.sprint10mSec !== undefined ? Number(data.sprint10mSec) : undefined,
        sprint20mSec: data.sprint20mSec !== undefined ? Number(data.sprint20mSec) : undefined,
        tTestSec: data.tTestSec !== undefined ? Number(data.tTestSec) : undefined,
        edgrenSideStepCount: data.edgrenSideStepCount !== undefined ? Number(data.edgrenSideStepCount) : undefined,
        semoTestSec: data.semoTestSec !== undefined ? Number(data.semoTestSec) : undefined,
        verticalJumpCm: vertJump,
        standingBroadJumpCm: data.standingBroadJumpCm !== undefined ? Number(data.standingBroadJumpCm) : undefined,
        medicineBallTossM: data.medicineBallTossM !== undefined ? Number(data.medicineBallTossM) : undefined,
        rssaBestSec: rssaBest,
        rssaMeanSec: rssaMean,
        rssaDecrementPercent: rssaDec,
        rastMaxPowerWatts: rastMax,
        rastMinPowerWatts: rastMin,
        rastAvgPowerWatts: rastAvg,
        rastFatigueIndex: rastFatigue,
        vo2maxMlKgMin: data.vo2maxMlKgMin !== undefined ? Number(data.vo2maxMlKgMin) : undefined,
      };

      const evaluation = evaluateBasketballFitness(basketballInputs);
      return { type: "basketball", evaluation };
    }

    // Default: General 8-item Fitness Evaluation
    const inputs: GeneralFitnessInputs = {
      age: data.age !== undefined ? Number(data.age) : undefined,
      weightKg: data.weightKg !== undefined ? Number(data.weightKg) : undefined,
      heightCm: data.heightCm !== undefined ? Number(data.heightCm) : undefined,
      bodyFatPercent: data.bodyFatPercent !== undefined ? Number(data.bodyFatPercent) : undefined,
      gripStrengthKg: data.gripStrengthKg !== undefined ? Number(data.gripStrengthKg) : undefined,
      vitalCapacityCc: data.vitalCapacityCc !== undefined ? Number(data.vitalCapacityCc) : undefined,
      standingBroadJumpCm: data.standingBroadJumpCm !== undefined ? Number(data.standingBroadJumpCm) : undefined,
      legStrengthKg: data.legStrengthKg !== undefined ? Number(data.legStrengthKg) : undefined,
      flexibilityCm: data.flexibilityCm !== undefined ? Number(data.flexibilityCm) : undefined,
      sitUps30Sec: data.sitUps30Sec !== undefined ? Number(data.sitUps30Sec) : undefined,
      pushUps30Sec: data.pushUps30Sec !== undefined ? Number(data.pushUps30Sec) : undefined,
    };

    const evaluation = evaluateGeneralFitness(inputs);
    return { type: "general", evaluation };
  });
}
