import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

import { setStepValidate, validateForm } from 'utils/formUtils'
import { Step } from '../../types/interfaces'

export default function RenderButtons(
  currentStep: Step,
  steps: Array<Step>,
  setSteps: Function,
  activeStep: number,
  setActiveStep: Function,
  onSubmit: Function,
  openValidateError: boolean,
  setOpenValidateError: Function
) {
  const isFirstStep = activeStep === 0
  const isLastStep = activeStep === steps.length - 1

  const onClickNextSection = () => {
    const isValid = validateForm(currentStep)

    if (!isValid) {
      setStepValidate(steps, setSteps, currentStep, true)
      setOpenValidateError(true)
      return
    }

    setActiveStep(activeStep + 1)
  }

  const onClickSubmit = () => {
    const isValid = validateForm(currentStep)

    if (!isValid) {
      setStepValidate(steps, setSteps, currentStep, true)
      setOpenValidateError(true)
      return
    }

    onSubmit()
  }

  return (
    <>
      <Box sx={{ py: 1 }} />
      <Grid container justifyContent='space-between'>
        <Grid item>
          {!isFirstStep && (
            <Button variant='outlined' onClick={() => setActiveStep(activeStep - 1)}>
              Previous Section
            </Button>
          )}
        </Grid>
        <Grid item>
          {isLastStep ? (
            <Button variant='contained' onClick={onClickSubmit}>
              Submit
            </Button>
          ) : (
            <Button variant='contained' onClick={onClickNextSection}>
              Next Section
            </Button>
          )}
        </Grid>
      </Grid>

      <Snackbar open={openValidateError} autoHideDuration={6000} onClose={() => setOpenValidateError(false)}>
        <Alert onClose={() => setOpenValidateError(false)} severity='error' sx={{ width: '100%' }}>
          This tab is not complete.
        </Alert>
      </Snackbar>
    </>
  )
}