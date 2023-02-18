import fs from 'fs'
import sharp from 'sharp'

import { Design, DesignElementSvg } from '../../types'

export default ({ design_id, design }: { design_id: string; design: Design }) => {
  const base_url = `./designs/${design_id}`
  const card_dimensions = design.production.card_dimensions

  if (!fs.existsSync(base_url)) {
    fs.mkdirSync(base_url)
  }

  const svgs = Object.values(design.production.types)
    .flat()
    .filter(element => element.type === 'svg') as DesignElementSvg[]

  const promises = svgs.map(async element => {
    const CONSTANT = 10
    const dim = {
      width: Math.floor(element.dimensions.width * (card_dimensions.width / 100) * CONSTANT),
      height: Math.floor(element.dimensions.height * (card_dimensions.height / 100) * CONSTANT),
    }
    await sharp(Buffer.from(element.svg.normal))
      .resize(dim)
      .toFile(`${base_url}/${element.id}_normal.png`)
    await sharp(Buffer.from(element.svg.masked))
      .resize(dim)
      .toFile(`${base_url}/${element.id}_masked.png`)
  })

  return Promise.all(promises)
}
