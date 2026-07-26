const EMPTY_SOCIAL_LINKS = {
  instagram: "",
  facebook: "",
  x: "",
  youtube: "",
  whatsapp: "",
  googleMaps: "",
  googleReviewUrl: "",
  website: ""
};

const EMPTY_SUPPORT = {
  email: "",
  phone: "",
  whatsapp: ""
};

const EMPTY_FSSAI = {
  fileUrl: "",
  fileName: "",
  fileType: "",
  uploadedAt: ""
};

export function createEmptyWebsiteContent(outletId = "") {
  return {
    outletId,
    hero: {
      title: "",
      description: "",
      videoUrl: "",
      buttonText: "Explore Menu",
      buttonLink: "/menu"
    },
    about: {
      story: "",
      vision: "",
      mission: "",
      futurePlans: ""
    },
    whatWeServe: [],
    bestFor: [],
    visualMoments: [],
    customerReviews: [],
    gallery: [],
    videos: [],
    socialLinks: { ...EMPTY_SOCIAL_LINKS },
    support: { ...EMPTY_SUPPORT },
    fssai: { ...EMPTY_FSSAI },
    updatedAt: "",
    createdAt: ""
  };
}

export function normalizeWebsiteContentPayload(payload = {}, outletId = "") {
  const base = createEmptyWebsiteContent(outletId);
  const source = payload && typeof payload === "object" ? payload : {};

  const hero = source.hero && typeof source.hero === "object" ? source.hero : {};
  const about = source.about && typeof source.about === "object" ? source.about : {};
  const socialLinks = source.socialLinks && typeof source.socialLinks === "object" ? source.socialLinks : {};
  const support = source.support && typeof source.support === "object" ? source.support : {};
  const fssai = source.fssai && typeof source.fssai === "object" ? source.fssai : {};

  return {
    ...base,
    ...source,
    outletId: String(source.outletId || outletId || base.outletId || ""),
    hero: {
      ...base.hero,
      ...hero,
      title: String(hero.title ?? base.hero.title ?? "").trim(),
      description: String(hero.description ?? base.hero.description ?? "").trim(),
      videoUrl: String(hero.videoUrl ?? base.hero.videoUrl ?? "").trim(),
      buttonText: String(hero.buttonText ?? base.hero.buttonText ?? "Explore Menu").trim(),
      buttonLink: String(hero.buttonLink ?? base.hero.buttonLink ?? "/menu").trim()
    },
    about: {
      ...base.about,
      ...about,
      story: String(about.story ?? base.about.story ?? "").trim(),
      vision: String(about.vision ?? base.about.vision ?? "").trim(),
      mission: String(about.mission ?? base.about.mission ?? "").trim(),
      futurePlans: String(about.futurePlans ?? base.about.futurePlans ?? "").trim()
    },
    whatWeServe: Array.isArray(source.whatWeServe) ? source.whatWeServe.map((item) => ({
      id: String(item?.id || ""),
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim(),
      image: String(item?.image || "").trim(),
      icon: String(item?.icon || "").trim()
    })).filter((item) => item.title || item.description || item.image) : [],
    bestFor: Array.isArray(source.bestFor) ? source.bestFor.map((item) => ({
      id: String(item?.id || ""),
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim(),
      image: String(item?.image || "").trim()
    })).filter((item) => item.title || item.description || item.image) : [],
    visualMoments: Array.isArray(source.visualMoments) ? source.visualMoments.map((item) => ({
      id: String(item?.id || ""),
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim(),
      videoUrl: String(item?.videoUrl || "").trim(),
      thumbnail: String(item?.thumbnail || "").trim()
    })).filter((item) => item.title || item.description || item.videoUrl || item.thumbnail) : [],
    customerReviews: Array.isArray(source.customerReviews) ? source.customerReviews.map((item) => ({
      id: String(item?.id || ""),
      name: String(item?.name || "").trim(),
      review: String(item?.review || "").trim(),
      rating: Number(item?.rating || 0),
      videoUrl: String(item?.videoUrl || "").trim(),
      customerImage: String(item?.customerImage || "").trim()
    })).filter((item) => item.name || item.review || item.videoUrl) : [],
    gallery: Array.isArray(source.gallery) ? source.gallery.map((item) => ({
      id: String(item?.id || ""),
      type: String(item?.type || "image").toLowerCase(),
      url: String(item?.url || "").trim(),
      title: String(item?.title || "").trim()
    })).filter((item) => item.url) : [],
    videos: Array.isArray(source.videos) ? source.videos.map((item) => ({
      id: String(item?.id || ""),
      title: String(item?.title || "").trim(),
      url: String(item?.url || "").trim(),
      description: String(item?.description || "").trim()
    })).filter((item) => item.url) : [],
    socialLinks: {
      ...base.socialLinks,
      ...socialLinks,
      instagram: String(socialLinks.instagram ?? base.socialLinks.instagram ?? "").trim(),
      facebook: String(socialLinks.facebook ?? base.socialLinks.facebook ?? "").trim(),
      x: String(socialLinks.x ?? base.socialLinks.x ?? "").trim(),
      youtube: String(socialLinks.youtube ?? base.socialLinks.youtube ?? "").trim(),
      whatsapp: String(socialLinks.whatsapp ?? base.socialLinks.whatsapp ?? "").trim(),
      googleMaps: String(socialLinks.googleMaps ?? base.socialLinks.googleMaps ?? "").trim(),
      googleReviewUrl: String(socialLinks.googleReviewUrl ?? base.socialLinks.googleReviewUrl ?? "").trim(),
      website: String(socialLinks.website ?? base.socialLinks.website ?? "").trim()
    },
    support: {
      ...base.support,
      ...support,
      email: String(support.email ?? base.support.email ?? "").trim(),
      phone: String(support.phone ?? base.support.phone ?? "").trim(),
      whatsapp: String(support.whatsapp ?? base.support.whatsapp ?? "").trim()
    },
    fssai: {
      ...base.fssai,
      ...fssai,
      fileUrl: String(fssai.fileUrl ?? base.fssai.fileUrl ?? "").trim(),
      fileName: String(fssai.fileName ?? base.fssai.fileName ?? "").trim(),
      fileType: String(fssai.fileType ?? base.fssai.fileType ?? "").trim(),
      uploadedAt: String(fssai.uploadedAt ?? base.fssai.uploadedAt ?? "").trim()
    },
    updatedAt: String(source.updatedAt || "").trim(),
    createdAt: String(source.createdAt || "").trim()
  };
}
