(function(){
    var socialize = new Models.Challenge({
        id: '001',
        name: 'Socialize',
        startDate: new Date(2012, 0, 18),
        endDate: new Date(2012, 0, 25),
        smallTestcases: 3,
        bigTestcases: 1,
        author: Users.findByName('EclipsE'),
        score: function(tc) {
            var s = 0, i;
            for (i = 0; i < 3; i++) s += tc.small[i];
            s += tc.big[0];
            return s - tc.penalty;
        }
    });

    socialize.addUser(Users.findByName('Belphegor'), {
        small: [100, 100, 100], big: [5000],
        penalty: 0
    });
    socialize.addUser(Users.findByName('MG-RAY'), {
        small: [100, 100, 100], big: [5000],
        penalty: 0
    });
    socialize.addUser(Users.findByName('zokocx'), {
        small: [100, 100, 100], big: [5000],
        penalty: 10
    });

    Challenges.add(socialize);

    var vox = new Models.Challenge({
        id: '002',
        name: 'Voxels',
        startDate: new Date(2012, 0, 26),
        endDate: new Date(2012, 1, 1),
        smallTestcases: 3,
        bigTestcases: 2,
        author: Users.findByName('MG-RAY'),
        score: function(tc) {
            return 0;
        }
    });
})();
