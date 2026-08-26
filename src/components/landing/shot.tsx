import Image from "next/image";

type ShotProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  url: string;
  caption: string;
  priority?: boolean;
};

export function Shot({ src, alt, width, height, url, caption, priority }: ShotProps) {
  return (
    <figure className="docs-shot">
      <div className="docs-shot-frame">
        <div className="docs-chrome" aria-hidden="true">
          <span className="docs-dots">
            <i />
            <i />
            <i />
          </span>
          <span>{url}</span>
        </div>
        <div className="docs-shot-stage">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="(max-width: 880px) 100vw, 72rem"
            priority={priority}
          />
        </div>
      </div>
      <figcaption className="docs-caption">{caption}</figcaption>
    </figure>
  );
}
