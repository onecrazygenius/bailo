import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ApprovalInterface } from '../../../../models/v2/Approval.js'
import { parse } from '../../../../utils/validate.js'

export const getComplianceApprovalsSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

interface GetComplianceApprovalsResponse {
  approvals: Array<ApprovalInterface>
}

export const getComplianceApprovals = [
  bodyParser.json(),
  async (req: Request, res: Response<GetComplianceApprovalsResponse>) => {
    const _ = parse(req, getComplianceApprovalsSchema)

    return res.json({
      approvals: [
        {
          model: 'yolo',
          release: '3.0.2',
          kind: 'access',
          active: true,
          createdAt: new Date('08/13/2023'),
          updatedAt: new Date('08/14/2023'),
        },
        {
          model: 'yolo',
          release: '3.0.1',
          kind: 'access',
          active: true,
          createdAt: new Date('08/12/2023'),
          updatedAt: new Date('08/12/2023'),
        },
      ],
    })
  },
]
