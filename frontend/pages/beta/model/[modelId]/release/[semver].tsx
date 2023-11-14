import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Card, Container, Divider, Stack, Typography } from '@mui/material'
import { useGetRelease } from 'actions/release'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useRouter } from 'next/router'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import EditableRelease from 'src/model/beta/releases/EditableRelease'
import ReviewBanner from 'src/model/beta/reviews/ReviewBanner'
import ReviewComments from 'src/reviews/ReviewComments'
import Wrapper from 'src/Wrapper.beta'

export default function Release() {
  const router = useRouter()
  const { modelId, semver }: { modelId?: string; semver?: string } = router.query

  const { release, isReleaseLoading, isReleaseError } = useGetRelease(modelId, semver)

  const {
    reviews: activeReviews,
    isReviewsLoading: isActiveReviewsLoading,
    isReviewsError: isActiveReviewsError,
  } = useGetReviewRequestsForModel({
    modelId,
    semver: semver || '',
    isActive: true,
  })

  const error = MultipleErrorWrapper('Unable to load release', {
    isReleaseError,
    isActiveReviewsError,
  })

  if (error) return error

  return (
    <Wrapper fullWidth title={release ? release.semver : 'Loading...'} page='release'>
      <Container maxWidth='md'>
        <Card>
          {isReleaseLoading && isActiveReviewsLoading && <Loading />}
          {release && (
            <>
              {activeReviews.length > 0 && <ReviewBanner release={release} />}
              <Stack spacing={2} sx={{ p: 4 }}>
                <Stack
                  direction={{ sm: 'row', xs: 'column' }}
                  spacing={2}
                  divider={<Divider flexItem orientation='vertical' />}
                >
                  <Link href={`/beta/model/${modelId}?tab=releases`}>
                    <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                      Back to model
                    </Button>
                  </Link>
                  <Typography variant='h6' color='primary' component='h2'>
                    {release ? release.semver : 'Loading...'}
                  </Typography>
                </Stack>
                {release && <EditableRelease release={release} />}
                <ReviewComments release={release} />
              </Stack>
            </>
          )}
        </Card>
      </Container>
    </Wrapper>
  )
}
