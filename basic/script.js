gsap.to("#box",{
    x : 800,
    duration:4,
    delay:1,
    rotate:360,
    backgroundColor:"blue",
    borderRadius:"50%" , 
    scale:1.5 ,
    
})

gsap.from("#box2", {
    duration:5,
    x:600,
    scale:0.5,
    backgroundColor:"grey",
    borderRadius:"50%",
    rotate:180
})
