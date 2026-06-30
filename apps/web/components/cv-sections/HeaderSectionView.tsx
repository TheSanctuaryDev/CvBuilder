// apps/web/components/cv-sections/HeaderSectionView.tsx
import type { HeaderSection } from '@/types/editor'
import { Mail, Phone, MapPin, Link2, GitBranch } from 'lucide-react'

const PHOTO_RADIUS: Record<string, string> = {
  circle:  '50%',
  rounded: '12px',
  square:  '0px',
}

function ContactItem({
  icon: Icon,
  text,
  iconStyle,
}: {
  icon: React.FC<{ style?: React.CSSProperties; className?: string }>
  text: string
  iconStyle?: import('@/types/editor').ContactIconStyle
}) {
  if (!text) return null
  const show = iconStyle?.show ?? false
  const pos  = iconStyle?.position ?? 'before'
  const color = iconStyle?.color ?? 'currentColor'
  const size  = iconStyle?.size ?? 1

  const iconEl = show ? (
    <Icon style={{ color, width: `${size}em`, height: `${size}em`, flexShrink: 0 }} />
  ) : null

  if (!show || pos === 'bullet') {
    return (
      <span className="flex items-center gap-1">
        {iconEl && <span className="flex items-center">{iconEl}</span>}
        {text}
      </span>
    )
  }
  if (pos === 'after') {
    return <span className="flex items-center gap-1">{text}{iconEl}</span>
  }
  return <span className="flex items-center gap-1">{iconEl}{text}</span>
}

export default function HeaderSectionView({ section }: { section: HeaderSection }) {
  const photoSize     = section.photoSize     ?? 80
  const photoPosition = section.photoPosition ?? 'right'
  const photoRadius   = PHOTO_RADIUS[section.photoShape ?? 'circle']

  const photo = section.photoBase64 && (
    <img
      src={section.photoBase64}
      alt={section.fullName}
      className="shrink-0 object-cover"
      style={{
        width:        photoSize,
        height:       photoSize,
        borderRadius: photoRadius,
        border:       '2px solid var(--cv-divider-color, #d1d5db)',
      }}
    />
  )

  return (
    <div className="mb-6">
      <div className={`flex items-start gap-4 ${photoPosition === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Infos principales */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--cv-name-color, #111111)', fontFamily: 'var(--cv-font, inherit)' }}
          >
            {section.fullName}
          </h1>
          {section.jobTitle && (
            <p className="text-base mt-1" style={{ color: 'var(--cv-accent-color, #4b5563)' }}>
              {section.jobTitle}
            </p>
          )}
          <div
            className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs"
            style={{ color: 'var(--cv-accent-color, #6b7280)' }}
          >
            {section.emails?.filter(Boolean).map((e, i) => (
              <ContactItem key={i} icon={Mail} text={e} iconStyle={section.contactIconStyle} />
            ))}
            {section.phones?.filter(p => p.number).map((p, i) => (
              <ContactItem key={i} icon={Phone} text={`${p.indicatif} ${p.number}`} iconStyle={section.contactIconStyle} />
            ))}
            {section.address  && <ContactItem icon={MapPin}    text={section.address}  iconStyle={section.contactIconStyle} />}
            {section.linkedIn && <ContactItem icon={Link2}    text={section.linkedIn} iconStyle={section.contactIconStyle} />}
            {section.gitHub   && <ContactItem icon={GitBranch} text={section.gitHub}  iconStyle={section.contactIconStyle} />}
          </div>
        </div>

        {photo}
      </div>

      <hr
        className="mt-3"
        style={{
          border:    'none',
          borderTop: 'var(--cv-divider-width, 1px) solid var(--cv-divider-color, #d1d5db)',
        }}
      />
    </div>
  )
}
