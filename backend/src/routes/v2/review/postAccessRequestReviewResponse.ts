import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { Decision, ReviewInterface } from '../../../models/v2/Review.js'
import { respondToReview } from '../../../services/v2/review.js'
import { ReviewKind } from '../../../types/v2/enums.js'
import { parse } from '../../../utils/v2/validate.js'

export const postAccessRequestReviewResponseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    accessRequestId: z.string(),
  }),
  body: z.object({
    role: z.string(),
    comment: z.string().optional(),
    decision: z.nativeEnum(Decision),
  }),
})

interface PostAccessRequestReviewResponse {
  review: ReviewInterface
}

export const postAccessRequestReviewResponse = [
  bodyParser.json(),
  async (req: Request, res: Response<PostAccessRequestReviewResponse>) => {
    const {
      params: { modelId, accessRequestId },
      body: { role, ...body },
    } = parse(req, postAccessRequestReviewResponseSchema)

    const review = await respondToReview(req.user, modelId, role, body, ReviewKind.Access, accessRequestId)

    return res.json({
      review,
    })
  },
]