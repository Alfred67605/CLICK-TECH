export function getSpecComponentImage(key: string, value: string): string | null {
  const k = key.toLowerCase();
  const v = value.toLowerCase();

  if (k.includes("cpu") || k.includes("procesador")) {
    if (v.includes("7600") || v.includes("7700") || v.includes("am5")) {
      return "/images/products/ct-cpu-r5-7600.webp";
    }
    if (v.includes("5700")) {
      return "/images/products/ct-cpu-r7-5700x.webp";
    }
    if (v.includes("5600g")) {
      return "/images/products/ct-cpu-r5-5600g.webp";
    }
    if (v.includes("5600") || v.includes("ryzen")) {
      return "/images/products/ct-cpu-r5-5600.webp";
    }
    if (v.includes("13400") || v.includes("14400") || v.includes("i7")) {
      return "/images/products/ct-cpu-i5-13400f.webp";
    }
    if (v.includes("12400") || v.includes("intel") || v.includes("core")) {
      return "/images/products/ct-cpu-i5-12400f.webp";
    }
  }

  if (k.includes("gpu") || k.includes("gráf") || k.includes("graf") || k.includes("video")) {
    if (v.includes("4070") || v.includes("4080")) {
      return "/images/products/ct-gpu-rtx4070s-dual.webp";
    }
    if (v.includes("rx") || v.includes("radeon")) {
      return "/images/products/ct-gpu-rx7600-pulse.webp";
    }
    if (v.includes("rtx") || v.includes("gtx") || v.includes("3050") || v.includes("4060")) {
      return "/images/products/ct-gpu-rtx4060-ventus.webp";
    }
  }

  if (k.includes("ram") || k.includes("memoria")) {
    if (v.includes("ddr5")) {
      return "/images/products/ct-ram-fury-32-d5.webp";
    }
    if (v.includes("32")) {
      return "/images/products/ct-ram-lpx-32-d4.webp";
    }
    return "/images/products/ct-ram-fury-16-d4.webp";
  }

  if (k.includes("ssd") || k.includes("almacenamiento") || k.includes("disco")) {
    if (v.includes("samsung") || v.includes("980")) {
      return "/images/products/ct-ssd-980-1tb.webp";
    }
    if (v.includes("mx500") || v.includes("sata")) {
      return "/images/products/ct-ssd-mx500-1tb.webp";
    }
    return "/images/products/ct-ssd-nv2-1tb.webp";
  }

  if (k.includes("placa") || k.includes("motherboard") || k.includes("chipset")) {
    if (v.includes("b650") || v.includes("am5")) {
      return "/images/products/ct-mb-b650m-a-wifi.webp";
    }
    if (v.includes("b760") || v.includes("lga1700")) {
      return "/images/products/ct-mb-b760m-ds3h.webp";
    }
    if (v.includes("b450")) {
      return "/images/products/ct-mb-b450m-steel.webp";
    }
    return "/images/products/ct-mb-b550m-pro-vdh.webp";
  }

  if (k.includes("fuente") || k.includes("psu") || k.includes("alimentación")) {
    if (v.includes("750") || v.includes("850") || v.includes("gold")) {
      return "/images/products/ct-psu-rm750e.webp";
    }
    if (v.includes("650")) {
      return "/images/products/ct-psu-a650bn.webp";
    }
    return "/images/products/ct-psu-cv550.webp";
  }

  if (k.includes("gabinete") || k.includes("case") || k.includes("torre")) {
    if (v.includes("h5") || v.includes("nzxt")) {
      return "/images/products/ct-case-h5-flow.webp";
    }
    return "/images/products/ct-case-versa-h18.webp";
  }

  if (k.includes("cooler") || k.includes("disipador") || k.includes("refriger")) {
    if (v.includes("peerless") || v.includes("120") || v.includes("líquida") || v.includes("liquida")) {
      return "/images/products/ct-cool-pa120se.webp";
    }
    return "/images/products/ct-cool-ak400.webp";
  }

  if (k.includes("monitor") || k.includes("pantalla")) {
    if (v.includes("27") || v.includes("odyssey") || v.includes("165")) {
      return "/images/products/ct-mon-odyssey-g5.webp";
    }
    return "/images/products/ct-mon-24gs60f.webp";
  }

  return null;
}
