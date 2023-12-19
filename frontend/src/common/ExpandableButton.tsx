import { Box, Button } from '@mui/material'
import { styled } from '@mui/material/styles'
import { ReactElement, useState } from 'react'

const StyledHoverSpan = styled('span')({
  animationName: 'test-open',
  animationDuration: '.5s',
  animationDirection: 'forwards',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  '@keyframes test-open': {
    '0%': {
      maxWidth: '0px',
    },
    '100%': {
      maxWidth: '400px',
    },
  },
})

const StyledSpan = styled('span')({
  animationName: 'test-closed',
  animationDuration: '.5s',
  animationDirection: 'backwards',
  animationFillMode: 'forwards',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  '@keyframes test-closed': {
    '0%': {
      maxWidth: '400px',
    },
    '100%': {
      maxWidth: '0px',
    },
  },
})

interface ExpandableButtonProps {
  label: string
  icon: ReactElement
  onClick: () => void
  ariaLabel: string
  height?: string
}

export default function ExpandableButton({ label, icon, onClick, ariaLabel, height = 'unset' }: ExpandableButtonProps) {
  const [hover, setHover] = useState(false)

  return (
    <Box sx={{ display: 'flex', overflow: 'hidden' }}>
      <Button
        onMouseEnter={() => setHover(!hover)}
        onMouseLeave={() => setHover(!hover)}
        onClick={() => onClick()}
        variant='outlined'
        data-test='expandableButton'
        aria-label={ariaLabel}
        sx={{ color: 'white', borderColor: 'white !important', height: height }}
      >
        {icon}
        {hover ? (
          <StyledHoverSpan className='test-open'>{label}</StyledHoverSpan>
        ) : (
          <StyledSpan className='test-closed'></StyledSpan>
        )}
      </Button>
    </Box>
  )
}
