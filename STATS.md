This subdirectory contains all the statistics and math used for
task duration estimation.

# Time estimation math

The math itself is not very complex.

Each "leaf task", that is, task with no children whose time
duration comes directly from a PERT estimation (optimistic,
expected, pessimistic hours required) is simply a random variable
that follows a Beta distribution.

Tasks with children come with a PERT estimation for the percentage
of the total work the currently defined child tasks account for.
(optimistic highest percentage, expected, pessimistic lowest
percentage). Let's assign the random variable distribution of
proportions the variable $P$, and its children $T_1,T_2,\dots$.

Thus, the distribution for the total amount of time the parent
will take is given by:

$$
T_{parent}=\frac{T_1+T_2+\dots}{P}
$$

Now, actually performing the exact symbolic transformations and
math to figure out the equation for the CDF/PDF of this resulting
distribution is very inefficient. Nor is performing numerical
convolution very efficient either.

Ironically, one of the most effective ways to control the balance
efficiency and exactness for statistics on complex distributions
is actually to literally simulate drawing random values from the
distribution and to turn that into an approximation for the actual
distribution. (this is known as Monte Carlo) On modern computers
which can do billions of operations per second, such simulations
are really a triviality.

