import arcjet, { shield, detectBot, tokenBucket, slidingWindow, type ArcjetWellKnownBot, type ArcjetBotCategory } from "@arcjet/node"; 
import { env } from "./env.js";

const isProduction = env.ARCJET_ENV === "production";
const mode = isProduction ? "LIVE" : "DRY_RUN";
const allowedBots: (ArcjetWellKnownBot | ArcjetBotCategory)[] = isProduction
  ? ["CATEGORY:SEARCH_ENGINE"]
  : ["CATEGORY:SEARCH_ENGINE", "POSTMAN"];


export const aj = arcjet({
  key : env.ARCJET_KEY,
  rules : [
    shield({ mode }),
    detectBot({ mode, allow: allowedBots }),
  ]
})


// ================================
// Auth — brute force login/register
// Très strict : 5 tentatives / 15 min par IP
// ================================

export const authRateLimiter = arcjet({
  key : env.ARCJET_KEY, 
  characteristics: ["ip.src"],
  rules : [
    shield({mode}), 
    slidingWindow ({
      mode : "LIVE", 
      interval : 900, // 15 minutes
      max : 5 // 5 tentatives
    })
  ]
}) 

// ================================
// Votes gratuits
// 5 votes / minute par IP (burst 10)
// ================================
export const voteRateLimiter = arcjet({
  key : env.ARCJET_KEY, 
  characteristics: ["ip.src"],
  rules : [
    shield({mode}), 
    tokenBucket({
      mode, 
      refillRate : 30, 
      interval : 60, 
      capacity : 60
    })
  ]
})

// ================================
// Paiements Mobile Money
// 3 / minute par IP (burst 5)
// ================================

export const paymentRateLimiter = arcjet({
  key : env.ARCJET_KEY, 
  characteristics : ["ip.src"],
  rules : [
    shield({mode}), 
    tokenBucket({
      mode, 
      refillRate : 3 , 
      interval : 60 , 
      capacity : 5
    })
  ]
})

// ================================
// Création de ressources (events, candidats, upload)
// 20 / minute par IP
// ================================
export const createRateLimiter = arcjet({
  key : env.ARCJET_KEY , 
  characteristics : ['ip.src'], 
  rules : [
    shield({mode }),
    slidingWindow({
      mode, 
      interval : 60 , 
      max : 20
    })
  ]
})

// ================================
// Pages publiques (slug, ranking)
// 60 / minute par IP — protection anti-scraping
// ================================
export const publicRateLimiter  = arcjet({
  key : env.ARCJET_KEY,
  characteristics : ["ip.src"],
  rules : [
    shield({mode}),
    detectBot({mode, allow: allowedBots}),
    slidingWindow({
      mode,
      interval : 60,
      max : 60
    })
  ]
}) 