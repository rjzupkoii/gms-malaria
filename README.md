Greater Mekong Subregion - Malaria Risk Assessment
--

[Google Earth Engine](https://earthengine.google.com/) App for assessing potential *Plasmodium falciparum* malaria risk based upon remotely sensed data and climate modeling.

---

## Development Conventions
Due to Google Earth Engine being JavaScript based, it may be necessary to use globally scoped variables within a source file. While this should generally be avoided as much as possible, when globals are necessary they should be prefixed with `g_` so as to avoid scoping issues (ex., `var g_example = 42;`). Unless it is a UI element in which case the prefix `ui_` should be used instead. Constant values should be defined using UPPER CASE (ex., `var THE_ANSWER = 42;`) and the `const` keyword should be used if supported. 

## Development Restrictions
The development of this project requires two remote repositories to be configured. The first is the repository that resides on [GitHub](https://github.com/) which allows access to project management functionality, and the second is within the [Google Earth Engine](https://earthengine.google.com/) ecosystem and resides at [Google Source](https://opensource.google/) under the [earthengine.googlesource.com](https://earthengine.googlesource.com/) subdomain. Due to code residing on Google Source, there are significant size restrictions in place on the project:

1. Files cannot exceed 1 MiB
2. The repository cannot exceed 30 MiB

As a practical matter this means that shapefiles and graphical resources should not be stored in the repository, and this is consistent with the practice of uploading them as Assets to Earth Engine. However, due to the scope of the collections available on Earth Engine, relevant shapefiles may already be in place through collections like the [FAO GAUL: Global Administrative Unit Layers](https://developers.google.com/earth-engine/datasets/catalog/FAO_GAUL_2015_level2).

## Deployment
Since Earth Engine requires paths and URLs that contain usernames, it will be necessary to first fork the project if you wish to deploy. Then you will be able to edit username references and paths as needed. Once that is complete, the following steps should be followed to deploy to Earth Engine:

1. Create a new repository within your Earth Engine environment, using the `gms-malaria` name is recommended
2. Sign-up for Google Source access via `git` at https://www.googlesource.com/new-password
3. Note the URL of the repository you created, typically `https://earthengine.googlesource.com/users/[USERNAME]/gms-malaria` where `[USERNAME]` is your username on Earth Engine
4. Using the git command line, clone the GitHub repository to your local machine, `git clone https://github.com/rjzupkoii/gms-malaria.git`
5. Change into the newly cloned repository
6. Add the Google Source repository, `git remote add google [URL]` where `[URL]` is the URL noted in Step 3

Upon completing Steps 1 - 6 you can use `git remote -v` to list the remote repositories registered with the repository on your local machine. You should see two remotes listed: one with named `origin` with a GitHub URL, and a second named `google` with a Google Source URL. Upon completing this process you can use the `refresh.sh` script in the `bash` directory to synchronize repositories between both locations. 

### Troubleshooting

When pushing a commit to Google Source the following error is returned:

> error: RPC failed; HTTP 400 curl 92 Stream error in the HTTP/2 framing layer<br> 
> send-pack: unexpected disconnect while reading sideband packet

Deleting the commit via a reset to the last known good push appears to resolve the error.


## Works Cited
Lehmann, T., Dao, A., Yaro, A. S., Adamou, A., Kassogue, Y., Diallo, M., Sékou, T., & Coscaron-Arias, C. (2010). Aestivation of the African Malaria Mosquito, Anopheles gambiae in the Sahel. *The American Society of Tropical Medicine and Hygiene*, 83(3), 601–606. https://doi.org/10.4269/ajtmh.2010.09-0779

Obsomer, V., Defourny, P., & Coosemans, M. (2007). The Anopheles dirus complex: Spatial distribution and environmental drivers. *Malaria Journal*, 6(1), 26. https://doi.org/10.1186/1475-2875-6-26

Obsomer, V., Defourny, P., & Coosemans, M. (2012). Predicted Distribution of Major Malaria Vectors Belonging to the Anopheles dirus Complex in Asia: Ecological Niche and Environmental Influences. *PLOS ONE*, 7(11), e50475. https://doi.org/10.1371/journal.pone.0050475
