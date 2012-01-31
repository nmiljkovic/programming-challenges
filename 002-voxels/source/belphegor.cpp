#include <iostream>
#include <vector>
#include <set>
#include <algorithm>

struct coords;
typedef unsigned short int ushort;
typedef unsigned long int ulong;
typedef std::set< coords > my_uq;
ushort X, Y, Z;
ushort*** voxel_matrix;

struct coords
{
    ushort x, y, z;
    ulong lin_inx;

    coords(ushort _x, ushort _y, ushort _z) : x(_x), y(_y), z(_z), lin_inx(x*X*Y+y*X+z) {}

    coords(const coords& o) : x(o.x), y(o.y), z(o.z), lin_inx(o.lin_inx) {}

    coords& operator = (const coords& o)
    {
        x = o.x;
        y = o.y;
        z = o.z;
        lin_inx = o.lin_inx;
        return *this;
    }

    bool operator < (const coords& o) const
    {
        return lin_inx < o.lin_inx;
    }
};

struct greater_size : public std::binary_function<const my_uq&,const my_uq&,bool>
{
    bool operator () (const my_uq& l, const my_uq& r) const
    {
        return l.size() > r.size();
    }
}; 

enum
{
    e_occupied  = 1,
    e_visited   = 2
};

inline bool is_occupied(ushort b)
{
    return b & e_occupied ? true : false;
}

inline bool is_visited(ushort b)
{
    return b & e_visited ? true : false;
}

inline void set_visited(ushort& b)
{
    b |= e_visited;
}

void find_adjacent_voxels(my_uq& sc, const coords& c)
{
    for(int ddx = -1; ddx <= 1; ++ddx)
    {
        for(int ddy = -1; ddy <= 1; ++ddy)
        {
            for(int ddz = -1; ddz <= 1; ++ddz)
            {
                int x = c.x + ddx;
                if(x < 0 || x >= X)
                {
                    continue;
                }
                int y = c.y + ddy;
                if(y < 0 || y >= Y)
                {
                    continue;
                }
                int z = c.z + ddz;
                if(z < 0 || z >= Z)
                {
                    continue;
                }

                coords current(x, y, z);
                
                ushort& vm = voxel_matrix[current.x][current.y][current.z];
                if(!is_visited(vm))
                {
                    set_visited(vm);
                    if(is_occupied(vm))
                    {
                        sc.insert(current);
                        find_adjacent_voxels(sc, current);
                    }
                }
            }
        }
    }

}

int main()
{
    std::cin >> X >> Y >> Z;
    std::vector< my_uq > v_result;
    voxel_matrix = new ushort**[X];
    for(ushort i = 0; i < X; ++i) 
    {
        voxel_matrix[i] = new ushort*[Y];
        for(ushort j = 0; j < Y; ++j)
        {
            voxel_matrix[i][j] = new ushort[Z];
        }
    }

    for(ushort i = 0; i < X; ++i)
    {
        for(ushort j = 0; j < Y; ++j)
        {
            for(ushort k = 0; k < Z; ++k)
            {
                std::cin >> voxel_matrix[i][j][k];
            }
        }
    }

    for(ushort i = 0; i < X; ++i)
    {
        for(ushort j = 0; j < Y; ++j)
        {
            for(ushort k = 0; k < Z; ++k)
            {
                ushort& vm = voxel_matrix[i][j][k];
                if(!is_visited(vm))
                {
                    set_visited(vm);
                    if(is_occupied(vm))
                    {
                        my_uq sc;
                        coords c(i, j, k);
                        sc.insert(c);
                        find_adjacent_voxels(sc, c);
                        v_result.push_back(sc);
                    }
                }
            }
        }
    }

    for(ushort i = 0; i < X; ++i) 
    {
        for(ushort j = 0; j < Y; ++j)
        {
            delete [] voxel_matrix[i][j];
        }
        delete [] voxel_matrix[i];
    }
    delete [] voxel_matrix;

    std::sort( v_result.begin(), v_result.end(), greater_size () );
    std::cout << v_result.size() << std::endl;
    for(std::size_t i = 0; i < v_result.size(); ++i)
    {
        std::cout << v_result[i].size() << std::endl;
    }

    return 0;
}