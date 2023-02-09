import { Types } from 'mongoose'
import { getDeploymentQueue } from '../utils/queues'
import { getEntitiesForUser, getUserListFromEntityList, parseEntityList } from '../utils/entity'
import { ApprovalStates, Approval, Entity } from '../../types/interfaces'
import { DeploymentDoc } from '../models/Deployment'
import ApprovalModel, { ApprovalTypes, ApprovalCategory } from '../models/Approval'
import { VersionDoc } from '../models/Version'
import { reviewApproval } from '../templates/reviewApproval'
import { BadReq } from '../utils/result'
import { sendEmail } from '../utils/smtp'
import { getUserByInternalId } from './user'
import { UserDoc } from '../models/User'
import { findVersionById } from './version'
import { findModelById } from './model'

export async function createDeploymentApprovals({ deployment }: { deployment: DeploymentDoc }) {
  const managers = await parseEntityList(deployment.metadata.contacts.owner)

  if (!managers.valid) {
    throw BadReq({ managers: deployment.metadata.contacts.owner }, `Invalid manager: ${managers.reason}`)
  }

  return createDeploymentApproval({
    approvers: deployment.metadata.contacts.owner,
    deployment,
    approvalType: ApprovalTypes.Manager,
  })
}

export async function createVersionApprovals({ version }: { version: VersionDoc }) {
  const [managers, reviewers] = await Promise.all([
    parseEntityList(version.metadata.contacts.manager),
    parseEntityList(version.metadata.contacts.reviewer),
  ])

  if (!managers.valid) {
    throw BadReq({ managers: version.metadata.contacts.manager }, `Invalid manager: ${managers.reason}`)
  }

  if (!reviewers.valid) {
    throw BadReq({ reviewers: version.metadata.contacts.reviewer }, `Invalid reviewer: '${reviewers.reason}'`)
  }

  const managerApproval = createVersionApproval({
    approvers: version.metadata.contacts.manager,
    version,
    approvalType: ApprovalTypes.Manager,
  })

  const reviewerApproval = createVersionApproval({
    approvers: version.metadata.contacts.reviewer,
    version,
    approvalType: ApprovalTypes.Reviewer,
  })

  return Promise.all([managerApproval, reviewerApproval])
}

async function createDeploymentApproval({
  approvers,
  approvalType,
  deployment,
}: {
  approvers: Array<Entity>
  approvalType: ApprovalTypes
  deployment: DeploymentDoc
}): Promise<Approval> {
  return createApproval({
    documentType: 'deployment',
    document: deployment,
    approvers,

    approvalType,
    approvalCategory: ApprovalCategory.Deployment,
  })
}

async function createVersionApproval({
  approvers,
  approvalType,
  version,
}: {
  approvers: Array<Entity>
  approvalType: ApprovalTypes
  version: VersionDoc
}): Promise<Approval> {
  return createApproval({
    documentType: 'version',
    document: version,
    approvers,

    approvalType,
    approvalCategory: ApprovalCategory.Upload,
  })
}

export type ApprovalDocumentType = 'version' | 'deployment'
async function createApproval({
  documentType,
  document,
  approvers,
  approvalType,
  approvalCategory,
}: {
  documentType: ApprovalDocumentType
  document: VersionDoc | DeploymentDoc
  approvers: Array<Entity>

  approvalType: ApprovalTypes
  approvalCategory: ApprovalCategory
}) {
  const doc = {
    [documentType]: document._id,
    approvers,

    approvalType,
    approvalCategory,
  }

  // If an approval already exists, we don't want to create a duplicate approval
  const { value: approval, lastErrorObject } = (await ApprovalModel.findOneAndUpdate(
    doc,
    {
      [documentType]: document._id,
      status: ApprovalStates.NoResponse,
    },
    {
      upsert: true,
      new: true,
      rawResult: true,
    }
  )) as unknown as any

  if (!lastErrorObject?.updatedExisting) {
    const users = await getUserListFromEntityList(approvers)

    for (const user of users) {
      if (user.email) {
        // we created a new approval, send out a notification.
        await sendEmail({
          to: user.email,
          ...(await reviewApproval({
            document,
            approvalCategory,
          })),
        })
      }
    }
  }

  return approval
}

export async function readNumApprovals({ userId }: { userId: Types.ObjectId }) {
  const user = await getUserByInternalId(userId)

  if (!user) {
    throw new Error(`Finding approvals for user that does not exist: ${userId}`)
  }

  const userEntities = await getEntitiesForUser(user)

  return ApprovalModel.countDocuments({
    status: 'No Response',
    $or: userEntities.map((userEntity) => ({
      approvers: { $elemMatch: { kind: userEntity.kind, id: userEntity.id } },
    })),
  })
}

export type ApprovalFilter = Types.ObjectId | undefined
export async function readApprovals({
  approvalCategory,
  filter,
  archived,
}: {
  approvalCategory: ApprovalCategory
  filter: ApprovalFilter
  archived: boolean
}) {
  const query: any = {
    status: 'No Response',
    approvalCategory,
  }

  if (filter) {
    const user = await getUserByInternalId(filter)

    if (!user) {
      throw new Error(`Finding approvals for user that does not exist: ${filter}`)
    }

    const userEntities = await getEntitiesForUser(user)

    query.$or = userEntities.map((userEntity) => ({
      approvers: { $elemMatch: { kind: userEntity.kind, id: userEntity.id } },
    }))
  }

  if (archived) {
    query.status = { $ne: 'No Response' }
  }

  return ApprovalModel.find(query)
    .populate({
      path: 'version',
      populate: { path: 'model' },
    })
    .populate({
      path: 'deployment',
      populate: { path: 'model' },
    })
    .sort({ updatedAt: -1 })
}

export async function getApproval({ approvalId }: { approvalId: string | Types.ObjectId }) {
  const approval = await ApprovalModel.findById(approvalId)

  if (!approval) {
    throw BadReq({ approvalId }, `Unable to find approval '${approvalId}'`)
  }

  return approval
}

export async function deleteApprovalsByVersion(user: UserDoc, version: VersionDoc) {
  return (ApprovalModel as any).delete(
    {
      version: version._id,
    },
    user._id
  )
}

export async function deleteApprovalsByDeployment(user: UserDoc, deployment: DeploymentDoc) {
  return (ApprovalModel as any).delete(
    {
      deployment: deployment._id,
    },
    user._id
  )
}

export async function requestDeploymentsForModelVersions(user: UserDoc, deployment: DeploymentDoc) {
  const model = await findModelById(user, deployment.model)
  if (!model) {
    throw BadReq({ code: 'model_not_found', deployment }, `Could not find parent model for deployment '${deployment}'`)
  }
  const { versions } = model
  if (!versions) {
    throw BadReq(
      { code: 'versions_not_found', deployment },
      `Could not find versions for deployment '${deployment.uuid}'`
    )
  }
  versions.forEach(async (versionId) => {
    const versionDoc = await findVersionById(user, versionId)
    if (!versionDoc) {
      throw BadReq(
        { code: 'versions_not_found', deployment },
        `Could not find version for deployment '${deployment.uuid}'`
      )
    }
    await (
      await getDeploymentQueue()
    ).add({
      deploymentId: deployment._id,
      userId: user._id,
      version: versionDoc.version,
    })
  })
}