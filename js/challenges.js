(function(){
    var socialize = new Models.Challenge({
        id: '001',
        name: 'Socialize',
        startDate: new Date(2012, 1, 18),
        endDate: new Date(2012, 1, 25),
        smallTestcases: 3,
        bigTestcases: 1
    });

    Challenges.add(socialize);
})();
