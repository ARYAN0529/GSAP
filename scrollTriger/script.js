
gsap.from("#page1 #box", {
    scale:0,
    delay:1,
    rotate:360,  
    duration:1,
})
gsap.from("#page2 #box", {
    scale:0,
    delay:1,
    rotate:360,  
    duration:1,
    // scrollTrigger:"page2 box"
    scrollTrigger: {
        trigger:"#page2 #box",
        scroller:"body",
        markers:true,
        start:"top 60%"
        }
})