#include <iostream>
#include <istream>
#include <vector>
#include <algorithm>

using namespace std;

struct Pair
{
    double length;
    unsigned count;

    friend istream& operator>>(istream& in, Pair& pair)
    {
        return in >> pair.count >> pair.length;
    }
};

inline bool sortem(const Pair& left, const Pair& right)
{
    return left.length < right.length;
}

int main()
{
    unsigned i, j;
    double length, currentLength;
    unsigned n;
    unsigned cnt;

    cin >> length >> n;

    vector<Pair> parts(n);

    for (i = 0; i < n; i++)
    {
        Pair temp; cin >> temp;
        parts[i] = temp;
    }

    sort(parts.begin(), parts.end(), sortem);

    i = 0; j = 0; cnt = 0;
    currentLength = length;
    while (i < n)
    {
        unsigned count = currentLength / parts[i].length;

        if (count == 0)
        {
            cnt++;
            currentLength = length;
            continue;
        }

        if (count > parts[i].count)
        {
            currentLength -= parts[i].count * parts[i].length;
            i++;
            continue;
        }

        currentLength -= count * parts[i].length;
        parts[i].count -= count;
        i = (parts[i].count == 0) ? (i + 1) : i;
    }

    cout << cnt;

    return 0;
}