var tl = gsap.timeline()

tl.to("h2", {
    y: 0,
    opacity: 1,
    duration: 0.8,
    delay: 0.3,
})

tl.to("h4", {
    opacity: 1,
    duration: 0.5,
    stagger: 0.15,
})